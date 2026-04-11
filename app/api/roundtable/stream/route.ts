import { runRoundtableStream } from "@/lib/orchestrator";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { resolveLlm } from "@/lib/server/resolve-llm";
import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import { roundtableStateSchema } from "@/lib/spec/schema";
import type { RoundtableState } from "@/lib/spec/schema";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  state: roundtableStateSchema,
  mode: z.enum(["graph", "deepagent"]).optional(),
});

function encodeSSE(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "信息格式不对，请刷新页面后再试。" }), {
      status: 400,
    });
  }

  const { state, mode } = parsed.data;
  let manifest;
  try {
    manifest = loadSkillManifest();
  } catch {
    return new Response(JSON.stringify({ error: "讨论席名录尚未备好，请稍后再试。" }), {
      status: 500,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const gen = runRoundtableStream({
          state,
          manifest,
          moderatorPrompt: "",
          resolveLlm,
          mode,
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
