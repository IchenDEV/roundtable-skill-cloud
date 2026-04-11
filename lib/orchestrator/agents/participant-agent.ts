import type { LlmRuntime } from "../../llm/types";
import type { StreamEvent } from "../../spec/schema";
import type { SkillManifest } from "../../skills/types";
import { streamLlmTurn } from "./llm-stream";

type SkillRow = SkillManifest["skills"][0];

/**
 * 列席代理：一次独立模型调用，仅注入本席 Skill，不代行他席。
 * 与主持、其他列席的上下文仅通过「已格式化 transcript」间接传递。
 */
export function buildParticipantSystemPrompt(skill: SkillRow, formattedTranscript: string): string {
  return `${skill.compiledPrompt}

你是圆桌中的**独立代理**，席位代号「${skill.name}」。你只拥有上述视角（Skill），不得冒充主持或其他列席发言。
你必须阅读全文记录（含「席上」用户插话），承接上文回应；末行 **简言之**：一句话。

【当前全文记录】
${formattedTranscript}`;
}

export async function* streamParticipantSkillAgent(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  formattedTranscript: string
): AsyncGenerator<StreamEvent> {
  const system = buildParticipantSystemPrompt(skill, formattedTranscript);
  yield* streamLlmTurn(runtime, model, "speaker", skill.skillId, [
    { role: "system", content: system },
    { role: "user", content: "请依你的视角发言（承接上文与席上插话）。" },
  ]);
}
