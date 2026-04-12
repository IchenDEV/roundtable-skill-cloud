import path from "node:path";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AIMessageChunk } from "@langchain/core/messages";
import type { LlmRuntime } from "../../llm/types";
import type { StreamEvent } from "../../spec/schema";
import type { SkillManifest } from "../../skills/types";
import { toLangChainModel } from "../../llm/to-langchain-model";
import { createSkillTools } from "./skill-tools";
import { extractMessageText } from "./extract-message-text";

type SkillRow = SkillManifest["skills"][0];

function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /abort/i.test(err.message);
}

/* ------------------------------------------------------------------ */
/*  Skill 目录解析（沙箱在 skills/ 下）                                 */
/* ------------------------------------------------------------------ */

function resolveSkillDir(dirPath: string): string {
  const abs = path.resolve(process.cwd(), dirPath);
  const root = path.resolve(process.cwd(), "skills");
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Skill path traversal blocked: ${dirPath}`);
  }
  return abs;
}

/* ------------------------------------------------------------------ */
/*  Prompt builders                                                    */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(displayName: string): string {
  return `# 身份锁定（不可违反）

你是「${displayName}」，且只能是「${displayName}」。
你的一切发言必须以「${displayName}」的第一人称视角输出。
绝对禁止：冒充主持人、冒充其他列席、以第三人称谈论自己、使用其他人物的口吻。
如果你不确定自己是谁，答案永远是：「${displayName}」。

# 工作目录

你的工作目录中有本席的思维框架文件：
- SKILL.md — 核心心智模型与表达 DNA（务必先阅读）
- references/research/* — 深度调研材料（按需查阅）

# 工作流程

1. 用 list_files 查看目录结构
2. 用 read_file 阅读 SKILL.md（必须完整阅读）
3. 按需查阅 references 中的材料补充论据
4. 以「${displayName}」的第一人称视角发言

# 输出要求

- 完全以「${displayName}」的语气、风格和思维方式回应
- 必须承接全文记录（含席上用户插话）
- 只输出本席正式发言内容，不要暴露工具使用、文件路径或规划过程
- 末行必须是：**简言之**：一句话概括`;
}

function buildUserMessage(formattedTranscript: string, displayName: string): string {
  return `【当前全文记录】
${formattedTranscript}

你是「${displayName}」。请以「${displayName}」的第一人称视角发言（承接上文与席上插话）。记住：你只能是「${displayName}」。`;
}

function buildDebateUserMessage(
  formattedTranscript: string,
  displayName: string,
  target?: string,
  directive?: string
): string {
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

你是「${displayName}」。以「${displayName}」的第一人称视角，${prompt}记住：你只能是「${displayName}」。`;
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
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const llm = toLangChainModel(runtime, model);
  const absDir = resolveSkillDir(skill.dirPath);
  const tools = createSkillTools(absDir);

  const agent = createReactAgent({
    llm,
    tools: [...tools],
    stateModifier: buildSystemPrompt(displayName),
  });

  let fullText = "";

  try {
    const stream = await agent.stream(
      { messages: [{ role: "user" as const, content: userContent }] },
      { streamMode: "messages", recursionLimit: 20, signal }
    );

    for await (const chunk of stream) {
      const msg = Array.isArray(chunk) ? chunk[0] : chunk;

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
    if (signal?.aborted || isAbortError(err)) {
      return;
    }
    const message = err instanceof Error ? err.message : "Agent execution failed";
    throw new Error(`[${skill.skillId}] ${message}`);
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
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const userContent = buildUserMessage(formattedTranscript, displayName);
  yield* streamReactAgent(runtime, model, skill, userContent, displayName, signal);
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
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const userContent = buildDebateUserMessage(formattedTranscript, displayName, target, directive);
  yield* streamReactAgent(runtime, model, skill, userContent, displayName, signal);
}
