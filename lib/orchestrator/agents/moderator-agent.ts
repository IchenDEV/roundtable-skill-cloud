import type { LlmRuntime } from "../../llm/types";
import { chatComplete } from "../../llm/stream-chat";
import type { StreamEvent } from "../../spec/schema";
import { streamLlmTurn } from "./llm-stream";

/** 主持人流式发言（开场 / 收束，讨论与辩论共用；差异由调用方 prompt 决定） */
export async function* streamModeratorTurn(
  runtime: LlmRuntime,
  model: string,
  modPrompt: string,
  userContent: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  yield* streamLlmTurn(
    runtime,
    model,
    "moderator",
    undefined,
    [
      { role: "system", content: modPrompt },
      { role: "user", content: userContent },
    ],
    signal
  );
}

/** 合成稿：用户消息内已含主持说明与全文 */
export async function* streamModeratorSynthesis(
  runtime: LlmRuntime,
  model: string,
  synUserBlob: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  yield* streamLlmTurn(runtime, model, "moderator", undefined, [{ role: "user", content: synUserBlob }], signal);
}

function stripThinkTags(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*$/, "")
    .trim();
}

export async function summarizeModeratorMemory(
  runtime: LlmRuntime,
  model: string,
  wrap: string,
  signal?: AbortSignal
): Promise<string> {
  const one = await chatComplete(
    runtime,
    model,
    [
      {
        role: "user",
        content: `将下列主持人轮末总结压缩为不超过 400 字的「记忆卡片」，只保留争点与待追问：\n\n${wrap}`,
      },
    ],
    signal
  );
  return stripThinkTags(one).slice(0, 600);
}
