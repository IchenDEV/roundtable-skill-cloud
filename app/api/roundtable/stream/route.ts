import { runRoundtableStream } from "@/lib/orchestrator";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { resolveLlm } from "@/lib/server/resolve-llm";
import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import { roundtableStateSchema } from "@/lib/spec/schema";
import type { RoundtableState } from "@/lib/spec/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { beginStreamSlot, endStreamSlot, takeStreamRateToken } from "@/lib/server/rate-limit-stream";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  state: roundtableStateSchema,
});

function encodeSSE(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function isDevLlmBypass() {
  return process.env.NODE_ENV === "development" && !!process.env.DEV_LLM_API_KEY?.trim();
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return new Response(JSON.stringify({ error: body.error }), {
      status: body.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const { state } = body.data;

  let guardKey: string;
  if (isDevLlmBypass()) {
    guardKey = `dev:${clientIpFromRequest(req)}`;
  } else {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return new Response(JSON.stringify({ error: "服务端未配置账户库。" }), {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "请先登入并在砚台钤印。" }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    guardKey = `u:${user.id}`;
  }

  if (!beginStreamSlot(guardKey)) {
    return new Response(JSON.stringify({ error: "同时进行中的讨论过多，请先完成当前一轮或稍候。" }), {
      status: 429,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  if (!takeStreamRateToken(guardKey)) {
    endStreamSlot(guardKey);
    return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
      status: 429,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let manifest;
  try {
    manifest = loadSkillManifest();
  } catch {
    endStreamSlot(guardKey);
    return new Response(JSON.stringify({ error: "讨论席名录尚未备好，请稍后再试。" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const releaseKey = guardKey;
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const gen = runRoundtableStream({
          state,
          manifest,
          resolveLlm,
        });
        const it = gen[Symbol.asyncIterator]();
        let n = await it.next();
        while (!n.done) {
          controller.enqueue(enc.encode(encodeSSE(n.value)));
          n = await it.next();
        }
        const finalState = n.value as RoundtableState;
        controller.enqueue(enc.encode(encodeSSE({ type: "finalize", state: finalState })));
        await persistRoundtableState(finalState);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(enc.encode(encodeSSE({ type: "error", message: msg })));
      } finally {
        endStreamSlot(releaseKey);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
