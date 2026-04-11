import type { LlmRuntime } from "../../llm/types";
import { chatComplete } from "../../llm/stream-chat";
import type { StreamEvent } from "../../spec/schema";
import { streamLlmTurn } from "./llm-stream";

export async function* streamModeratorOpening(
  runtime: LlmRuntime,
  model: string,
  modPrompt: string,
  userContent: string
): AsyncGenerator<StreamEvent> {
  yield* streamLlmTurn(runtime, model, "moderator", undefined, [
    { role: "system", content: modPrompt },
    { role: "user", content: userContent },
  ]);
}

export async function* streamModeratorWrap(
  runtime: LlmRuntime,
  model: string,
  modPrompt: string,
  userContent: string
): AsyncGenerator<StreamEvent> {
  yield* streamLlmTurn(runtime, model, "moderator", undefined, [
    { role: "system", content: modPrompt },
    { role: "user", content: userContent },
  ]);
}

/** 合成稿：用户消息内已含主持说明与全文 */
export async function* streamModeratorSynthesis(
  runtime: LlmRuntime,
  model: string,
  synUserBlob: string
): AsyncGenerator<StreamEvent> {
  yield* streamLlmTurn(runtime, model, "moderator", undefined, [{ role: "user", content: synUserBlob }]);
}

export async function summarizeModeratorMemory(runtime: LlmRuntime, model: string, wrap: string): Promise<string> {
  const one = await chatComplete(runtime, model, [
    {
      role: "user",
      content: `将下列主持人轮末总结压缩为不超过 400 字的「记忆卡片」，只保留争点与待追问：\n\n${wrap}`,
    },
  ]);
  return one.slice(0, 600);
}
