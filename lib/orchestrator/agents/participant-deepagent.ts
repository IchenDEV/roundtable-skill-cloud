import path from "node:path";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { AIMessageChunk } from "@langchain/core/messages";
import type { LlmRuntime } from "../../llm/types";
import type { StreamEvent } from "../../spec/schema";
import type { SkillManifest } from "../../skills/types";
import { toLangChainModel } from "../../llm/to-langchain-model";
import { extractMessageText } from "./extract-message-text";

type SkillRow = SkillManifest["skills"][0];

/* ------------------------------------------------------------------ */
/*  Read-only filesystem backend (blocks write / edit / delete)       */
/* ------------------------------------------------------------------ */

class ReadOnlyFsBackend extends FilesystemBackend {
  async write(): Promise<never> {
    throw new Error("Read-only backend: write not allowed");
  }
  async edit(): Promise<never> {
    throw new Error("Read-only backend: edit not allowed");
  }
}

/* ------------------------------------------------------------------ */
/*  System / user prompt builders                                     */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(skill: SkillRow, displayName?: string): string {
  const seatName = displayName || skill.name;
  return `你是圆桌中的独立代理，席名「${seatName}」（skillId: ${skill.skillId}）。
你只能代表本席发言，不得冒充主持或其他列席。
输出中不要出现 skillId 或方括号标记，直接以本席人物口吻发言。

你的工作目录中包含：
- /SKILL.md — 你的思维框架与表达 DNA（务必先阅读）
- /references/research/* — 深度调研材料（按需查阅）

**工作流程**：
1. 先阅读 /SKILL.md 获取你的核心心智模型与表达方式
2. 如需更深入的论据或细节，查阅 references 中的材料
3. 以该人物的第一人称视角发言

**输出要求**：
- 完全以该人物的语气、风格和思维方式回应
- 必须承接全文记录与席上插话
- 只输出本席正式发言内容
- 不要暴露工具使用、文件路径或规划过程
- 末行必须是：**简言之**：一句话概括`;
}

function buildUserMessage(formattedTranscript: string): string {
  return `【当前全文记录】
${formattedTranscript}

请依你的视角发言（承接上文与席上插话）。`;
}

function buildDebateUserMessage(formattedTranscript: string, target?: string, directive?: string): string {
  const rebuttal = target
    ? `\n\n你本轮的首要任务：**点名反驳【${target}】${directive ? `关于「${directive}」` : ""}的核心论点**，指出其逻辑漏洞或事实错误，然后再阐述你自己的立场。`
    : directive
      ? `\n\n你本轮的发言方向：${directive}。`
      : "";

  const prompt = target
    ? `请先反驳【${target}】的论点，再阐述你的立场（承接上文与席上插话）。`
    : "请就当前争点发表你的独立论述（承接上文与席上插话）。";

  return `【当前全文记录】
${formattedTranscript}${rebuttal}

${prompt}`;
}

/* ------------------------------------------------------------------ */
/*  Deep agent creation helper                                        */
/* ------------------------------------------------------------------ */

function resolveSkillDir(dirPath: string): string {
  const abs = path.resolve(process.cwd(), dirPath);
  const root = path.resolve(process.cwd(), "skills");
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Skill path traversal blocked: ${dirPath}`);
  }
  return abs;
}

async function createParticipantAgent(runtime: LlmRuntime, model: string, skill: SkillRow, displayName?: string) {
  const llm = toLangChainModel(runtime, model);
  const absDir = resolveSkillDir(skill.dirPath);

  return createDeepAgent({
    model: llm,
    backend: new ReadOnlyFsBackend({ rootDir: absDir, virtualMode: true }),
    systemPrompt: buildSystemPrompt(skill, displayName),
  });
}

/* ------------------------------------------------------------------ */
/*  Streaming bridge: deepagent → StreamEvent                         */
/* ------------------------------------------------------------------ */

async function* streamDeepAgent(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  userContent: string,
  displayName?: string
): AsyncGenerator<StreamEvent> {
  const agent = await createParticipantAgent(runtime, model, skill, displayName);

  let fullText = "";

  try {
    const stream = await agent.stream(
      { messages: [{ role: "user" as const, content: userContent }] },
      { streamMode: "messages" }
    );

    for await (const chunk of stream) {
      // streamMode: "messages" yields [message, metadata] tuples
      const msg = Array.isArray(chunk) ? chunk[0] : chunk;

      // Only forward visible assistant text, skip tool calls / tool results
      if (msg instanceof AIMessageChunk) {
        if (msg.tool_call_chunks && msg.tool_call_chunks.length > 0) continue;
        const text = extractMessageText(msg.content);
        if (text) {
          fullText += text;
          yield { type: "token", role: "speaker", skillId: skill.skillId, text };
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deep agent execution failed";
    yield { type: "error", message: `[${skill.skillId}] ${message}` };
  }

  yield {
    type: "turn_complete",
    role: "speaker",
    skillId: skill.skillId,
    fullText: fullText.trim(),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API (drop-in replacement for participant-agent.ts)         */
/* ------------------------------------------------------------------ */

/** 讨论模式列席代理（deep agent 版） */
export async function* streamParticipantDeepAgent(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  formattedTranscript: string,
  displayName?: string
): AsyncGenerator<StreamEvent> {
  const userContent = buildUserMessage(formattedTranscript);
  yield* streamDeepAgent(runtime, model, skill, userContent, displayName);
}

/** 辩论模式列席代理（deep agent 版） */
export async function* streamDebateParticipantDeepAgent(
  runtime: LlmRuntime,
  model: string,
  skill: SkillRow,
  formattedTranscript: string,
  target?: string,
  directive?: string,
  displayName?: string
): AsyncGenerator<StreamEvent> {
  const userContent = buildDebateUserMessage(formattedTranscript, target, directive);
  yield* streamDeepAgent(runtime, model, skill, userContent, displayName);
}
