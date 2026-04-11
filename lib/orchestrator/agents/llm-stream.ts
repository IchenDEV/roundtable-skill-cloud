import type { LlmRuntime } from "../../llm/types";
import { streamChat } from "../../llm/stream-chat";
import type { StreamEvent } from "../../spec/schema";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

/** 单次 LLM 流式调用，映射为圆桌 token / turn_complete 事件 */
export async function* streamLlmTurn(
  runtime: LlmRuntime,
  model: string,
  role: "moderator" | "speaker",
  skillId: string | undefined,
  messages: ChatMsg[]
): AsyncGenerator<StreamEvent> {
  let full = "";
  for await (const t of streamChat(runtime, model, messages)) {
    full += t;
    yield { type: "token", role, skillId, text: t };
  }
  yield { type: "turn_complete", role, skillId, fullText: full };
}
