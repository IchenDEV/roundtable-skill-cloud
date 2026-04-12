type TextLikeBlock = {
  type?: unknown;
  text?: unknown;
  content?: unknown;
  delta?: unknown;
  value?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * LangChain message chunks may carry visible text as plain strings or
 * structured content blocks. Normalize both shapes so participant turns do
 * not collapse to empty transcript entries.
 */
export function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map((part) => extractMessageText(part)).join("");
  }

  if (!isRecord(content)) return "";

  const block = content as TextLikeBlock;
  const type = typeof block.type === "string" ? block.type : "";

  if (type === "tool_use" || type === "tool_result") {
    return "";
  }

  if (typeof block.text === "string") {
    return block.text;
  }

  if ("content" in block) {
    return extractMessageText(block.content);
  }

  if ("delta" in block) {
    return extractMessageText(block.delta);
  }

  if ("value" in block) {
    return extractMessageText(block.value);
  }

  return "";
}
