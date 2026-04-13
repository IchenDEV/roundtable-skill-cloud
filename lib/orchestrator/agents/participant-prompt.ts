import fs from "node:fs";
import path from "node:path";

const MAX_SKILL_PROMPT_CHARS = 20_000;

export function loadEmbeddedSkillMarkdown(absDir: string) {
  const skillFile = path.join(absDir, "SKILL.md");
  const raw = fs.readFileSync(skillFile, "utf8");
  if (raw.length <= MAX_SKILL_PROMPT_CHARS) return raw;
  return `${raw.slice(0, MAX_SKILL_PROMPT_CHARS)}\n\n[truncated]`;
}

export function buildSystemPrompt(displayName: string, skillMarkdown: string) {
  return `# 身份锁定（不可违反）

你是「${displayName}」，且只能是「${displayName}」。
你的一切发言必须以「${displayName}」的第一人称视角输出。
绝对禁止：冒充主持人、冒充其他列席、以第三人称谈论自己、使用其他人物的口吻。
如果你不确定自己是谁，答案永远是：「${displayName}」。
不得输出任何「【...】」或「某人：」式说话人标签，界面会自动标注你的身份。

# 工作目录

你已提前获得本席的 SKILL.md 正文，视为必须完成阅读：

\`\`\`md
${skillMarkdown}
\`\`\`

工作目录中仍有补充材料可按需查阅：
- references/research/* — 深度调研材料（按需查阅）

# 工作流程

1. 先以内嵌的 SKILL.md 锁定身份、立场、表达 DNA
2. 按需用 list_files / read_file 查阅 references 中的材料补充论据
3. 以「${displayName}」的第一人称视角发言

# 输出要求

- 完全以「${displayName}」的语气、风格和思维方式回应
- 必须承接全文记录（含席上用户插话）
- 只输出本席正式发言内容，不要暴露工具使用、文件路径或规划过程
- 不得代主持人、不得替其他列席拟稿、不得伪造多人轮流发言
- 末行必须是：**简言之**：一句话概括`;
}

export function buildUserMessage(formattedTranscript: string, displayName: string) {
  return `【当前全文记录】
${formattedTranscript}

你是「${displayName}」。请以「${displayName}」的第一人称视角发言（承接上文与席上插话）。记住：你只能是「${displayName}」。`;
}

export function buildDebateUserMessage(
  formattedTranscript: string,
  displayName: string,
  target?: string,
  directive?: string
) {
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
