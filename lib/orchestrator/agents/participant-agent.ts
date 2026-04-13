import path from "node:path";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { LlmRuntime } from "../../llm/types";
import type { StreamEvent } from "../../spec/schema";
import type { SkillManifest } from "../../skills/types";
import { toLangChainModel } from "../../llm/to-langchain-model";
import { chatComplete } from "../../llm/stream-chat";
import { createSkillTools } from "./skill-tools";
import { extractMessageText } from "./extract-message-text";
import {
  buildDebateUserMessage,
  buildSystemPrompt,
  buildUserMessage,
  loadEmbeddedSkillMarkdown,
} from "./participant-prompt";
import { hasParticipantBoundaryViolation } from "./role-guard";

type SkillRow = SkillManifest["skills"][0];

function isAbortSignalLike(value: unknown): value is AbortSignal {
  return typeof value === "object" && value !== null && "aborted" in value;
}

function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /abort/i.test(err.message);
}

/* ------------------------------------------------------------------ */
/*  Skill 目录解析（沙箱在 skills/ 下）                                 */
/* ------------------------------------------------------------------ */

const SKILL_SOURCE_ROOTS = ["skills", "skills-superman/skills"].map((root) =>
  path.resolve(/* turbopackIgnore: true */ process.cwd(), root)
);

function resolveSkillDir(dirPath: string): string {
  const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), dirPath);
  const isAllowed = SKILL_SOURCE_ROOTS.some((root) => abs === root || abs.startsWith(root + path.sep));
  if (!isAllowed) {
    throw new Error(`Skill path traversal blocked: ${dirPath}`);
  }
  return abs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractVisibleAssistantText(message: unknown): string {
  if (!isRecord(message)) return "";

  const maybeGetType = message.getType;
  if (typeof maybeGetType === "function" && maybeGetType.call(message) === "tool") {
    return "";
  }

  if ("tool_call_id" in message) return "";

  const toolCallChunks = message.tool_call_chunks;
  if (Array.isArray(toolCallChunks) && toolCallChunks.length > 0) {
    return "";
  }

  const primary = "content" in message ? extractMessageText(message.content) : "";
  if (primary) return primary;

  const fallbackFields: unknown[] = [
    "text" in message ? message.text : undefined,
    "additional_kwargs" in message && isRecord(message.additional_kwargs)
      ? message.additional_kwargs.content
      : undefined,
    "additional_kwargs" in message && isRecord(message.additional_kwargs)
      ? message.additional_kwargs.output_text
      : undefined,
    "kwargs" in message && isRecord(message.kwargs) ? message.kwargs.content : undefined,
    "lc_kwargs" in message && isRecord(message.lc_kwargs) ? message.lc_kwargs.content : undefined,
  ];

  for (const candidate of fallbackFields) {
    const text = extractMessageText(candidate);
    if (text) return text;
  }

  return "";
}

/* ------------------------------------------------------------------ */
/*  Streaming bridge: LangChain ReAct agent → StreamEvent              */
/* ------------------------------------------------------------------ */

async function* streamReactAgent(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  userContent: string,
  displayName: string,
  participantNames: string[],
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const llm = toLangChainModel(runtime, model);
  const absDir = resolveSkillDir(skill.dirPath);
  const skillMarkdown = loadEmbeddedSkillMarkdown(absDir);
  const tools = createSkillTools(absDir);

  const agent = createReactAgent({
    llm,
    tools: [...tools],
    stateModifier: buildSystemPrompt(displayName, skillMarkdown),
  });

  let fullText = "";

  try {
    const stream = await agent.stream(
      { messages: [{ role: "user" as const, content: userContent }] },
      { streamMode: "messages", recursionLimit: 20, signal }
    );

    for await (const chunk of stream) {
      const msg = Array.isArray(chunk) ? chunk[0] : chunk;
      const text = extractVisibleAssistantText(msg);
      if (text) {
        fullText += text;
        yield { type: "token", role: "speaker", skillId: skill.skillId, text };
      }
    }
  } catch (err) {
    if (signal?.aborted || isAbortError(err)) {
      return;
    }
    const message = err instanceof Error ? err.message : "Agent execution failed";
    throw new Error(`[${skill.skillId}] ${message}`);
  }

  if (hasParticipantBoundaryViolation(fullText, displayName, participantNames)) {
    const repaired = (
      await chatComplete(
        runtime,
        model,
        [
          {
            role: "system",
            content: `${buildSystemPrompt(displayName, skillMarkdown)}\n\n补充硬约束：绝不允许输出任何「【...】」或「某人：」式标签；绝不允许代主持人或其他列席发言。`,
          },
          {
            role: "user",
            content: `${userContent}\n\n你刚才的草稿越界了，因为它出现了冒充主持/他席或伪造说话人标签的写法。请保留本席观点，直接重写为一段合规发言。只输出最终稿，不要解释。\n\n需修正的草稿：\n${fullText}`,
          },
        ],
        signal
      )
    ).trim();

    if (!hasParticipantBoundaryViolation(repaired, displayName, participantNames) && repaired) {
      fullText = repaired;
    }
  }

  yield {
    type: "turn_complete",
    role: "speaker",
    skillId: skill.skillId,
    fullText: fullText.trim(),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** 讨论模式列席代理 */
export async function* streamParticipantTurn(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  formattedTranscript: string,
  displayName: string,
  participantNamesOrSignal?: string[] | AbortSignal,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const participantNames = Array.isArray(participantNamesOrSignal) ? participantNamesOrSignal : [];
  const actualSignal = isAbortSignalLike(participantNamesOrSignal) ? participantNamesOrSignal : signal;
  const userContent = buildUserMessage(formattedTranscript, displayName);
  yield* streamReactAgent(runtime, model, skill, userContent, displayName, participantNames, actualSignal);
}

/** 辩论模式列席代理 */
export async function* streamDebateParticipantTurn(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  formattedTranscript: string,
  displayName: string,
  target?: string,
  directive?: string,
  participantNamesOrSignal?: string[] | AbortSignal,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const participantNames = Array.isArray(participantNamesOrSignal) ? participantNamesOrSignal : [];
  const actualSignal = isAbortSignalLike(participantNamesOrSignal) ? participantNamesOrSignal : signal;
  const userContent = buildDebateUserMessage(formattedTranscript, displayName, target, directive);
  yield* streamReactAgent(runtime, model, skill, userContent, displayName, participantNames, actualSignal);
}
