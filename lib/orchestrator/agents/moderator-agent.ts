import type { LlmRuntime } from "../../llm/types";
import { chatComplete, streamChat } from "../../llm/stream-chat";
import type { StreamEvent } from "../../spec/schema";
import { hasModeratorBoundaryViolation } from "./role-guard";

function isAbortSignalLike(value: unknown): value is AbortSignal {
  return typeof value === "object" && value !== null && "aborted" in value;
}

/** 主持人流式发言（开场 / 收束，讨论与辩论共用；差异由调用方 prompt 决定） */
export async function* streamModeratorTurn(
  runtime: LlmRuntime,
  model: string,
  modPrompt: string,
  userContent: string,
  participantNamesOrSignal?: string[] | AbortSignal,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const participantNames = Array.isArray(participantNamesOrSignal) ? participantNamesOrSignal : [];
  const actualSignal = isAbortSignalLike(participantNamesOrSignal) ? participantNamesOrSignal : signal;
  const messages = [
    {
      role: "system" as const,
      content: `${modPrompt}\n\n补充硬约束：只允许以主持人口吻直接推进；不得输出任何「【...】」或「某人：」式说话人标签；不得替任何列席撰写完整发言。`,
    },
    { role: "user" as const, content: userContent },
  ];

  let full = "";
  for await (const t of streamChat(runtime, model, messages, actualSignal)) {
    full += t;
    yield { type: "token", role: "moderator", text: t };
  }

  if (hasModeratorBoundaryViolation(full, participantNames)) {
    const repaired = (
      await chatComplete(
        runtime,
        model,
        [
          messages[0],
          {
            role: "user",
            content: `${userContent}\n\n你刚才的主持稿越界了，因为它出现了代列席发言或伪造说话人标签。请仅保留主持人的引导、追问或收束，直接重写为合规主持稿。只输出最终稿，不要解释。\n\n需修正的草稿：\n${full}`,
          },
        ],
        actualSignal
      )
    ).trim();

    if (!hasModeratorBoundaryViolation(repaired, participantNames) && repaired) {
      full = repaired;
    }
  }

  yield { type: "turn_complete", role: "moderator", fullText: full };
}

/** 合成稿：用户消息内已含主持说明与全文 */
export async function* streamModeratorSynthesis(
  runtime: LlmRuntime,
  model: string,
  synUserBlob: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  let full = "";
  for await (const t of streamChat(runtime, model, [{ role: "user", content: synUserBlob }], signal)) {
    full += t;
    yield { type: "token", role: "moderator", text: t };
  }
  yield { type: "turn_complete", role: "moderator", fullText: full };
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
