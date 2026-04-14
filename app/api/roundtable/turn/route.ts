import { runSingleTurn } from "@/lib/orchestrator/run-single-turn";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { resolveLlm } from "@/lib/server/resolve-llm";
import {
  buildServerRequestContext,
  jsonError,
  normalizeUpstreamLlmError,
  requireAuthenticatedUser,
} from "@/lib/server/request-context";
import { turnRequestSchema } from "@/lib/spec/schema";
import { beginStreamSlot, endStreamSlot, takeStreamRateToken } from "@/lib/server/rate-limit-stream";
import { parseJsonBody } from "@/lib/server/parse-json-body";

export const runtime = "nodejs";
export const maxDuration = 120;

function encodeSSE(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, turnRequestSchema);
  if (!body.ok) {
    return jsonError(body.error, body.status);
  }

  const request = body.data;
  const ctx = await buildServerRequestContext(req, { allowDevBypass: true });
  const authError = requireAuthenticatedUser(ctx, {
    noStoreMessage: "服务端未配置账户库。",
    unauthenticatedMessage: "请先登入并在砚台钤印。",
  });
  if (authError) return authError;

  const guardKey = ctx.guardKey ?? "unknown";

  if (!beginStreamSlot(guardKey)) {
    return jsonError("同时进行中的讨论过多，请先完成当前一轮或稍候。", 429);
  }
  if (!takeStreamRateToken(guardKey)) {
    endStreamSlot(guardKey);
    return jsonError("请求过于频繁，请稍后再试。", 429);
  }

  let manifest;
  try {
    manifest = loadSkillManifest();
  } catch {
    endStreamSlot(guardKey);
    return jsonError("讨论席名录尚未备好，请稍后再试。", 500);
  }

  let resolved;
  try {
    resolved = await resolveLlm(ctx);
  } catch (e) {
    endStreamSlot(guardKey);
    const msg = e instanceof Error ? e.message : "执笔后端解析失败。";
    return jsonError(msg, 500);
  }

  const releaseKey = guardKey;
  const abortSignal = req.signal;
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let released = false;

      const releaseSlot = () => {
        if (released) return;
        released = true;
        endStreamSlot(releaseKey);
      };

      const onAbort = () => {
        releaseSlot();
      };

      abortSignal.addEventListener("abort", onAbort, { once: true });
      try {
        for await (const ev of runSingleTurn({ request, manifest, resolved, signal: abortSignal })) {
          if (abortSignal.aborted) break;
          controller.enqueue(enc.encode(encodeSSE(ev)));
        }
      } catch (err) {
        if (!abortSignal.aborted) {
          const msg = normalizeUpstreamLlmError(err);
          controller.enqueue(enc.encode(encodeSSE({ type: "error", message: msg })));
          controller.enqueue(enc.encode(encodeSSE({ type: "done" })));
        }
      } finally {
        abortSignal.removeEventListener("abort", onAbort);
        releaseSlot();
        if (!abortSignal.aborted) {
          controller.close();
        }
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
