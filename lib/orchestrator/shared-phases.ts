import { streamModeratorSynthesis } from "./agents/moderator-agent";
import { formatTranscript } from "./format-context";
import type { LlmRuntime } from "../llm/types";
import type { RoundtableState, StreamEvent } from "../spec/schema";

export function nowIso() {
  return new Date().toISOString();
}

/** 合成结案（讨论 / 辩论共用） */
export async function* runSynthesisPhase(
  runtime: LlmRuntime,
  model: string,
  modPrompt: string,
  state: RoundtableState
): AsyncGenerator<StreamEvent, RoundtableState> {
  const ctx = formatTranscript(state.transcript);
  const synBlob = `${modPrompt}\n\n议题：${state.topic}\n\n全文记录：\n${ctx}\n\n请输出最终合成稿，分节：共识 / 分歧 / 开放问题 / 可执行结论。`;
  let syn = "";
  for await (const ev of streamModeratorSynthesis(runtime, model, synBlob)) {
    if (ev.type === "turn_complete") syn = ev.fullText;
    yield ev;
  }
  const finalState: RoundtableState = {
    ...state,
    phase: "done",
    synthesis: syn,
    transcript: [...state.transcript, { role: "moderator", content: syn, ts: nowIso() }],
  };
  yield { type: "synthesis_complete", text: syn };
  yield { type: "done" };
  return finalState;
}
