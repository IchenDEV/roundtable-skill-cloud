type TextLikeBlock = {
  type?: unknown;
  text?: unknown;
  content?: unknown;
  delta?: unknown;
  value?: unknown;
  parts?: unknown;
  output_text?: unknown;
  output?: unknown;
  message?: unknown;
  items?: unknown;
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

  if (
    type === "tool_use" ||
    type === "tool_result" ||
    type === "server_tool_call" ||
    type === "server_tool_result" ||
    type === "reasoning" ||
    type === "thinking" ||
    type === "redacted_thinking"
  ) {
    return "";
  }

  if (typeof block.text === "string") {
    return block.text;
  }

  if (typeof block.output_text === "string") {
    return block.output_text;
  }

  if ("content" in block) {
    return extractMessageText(block.content);
  }

  if ("parts" in block) {
    return extractMessageText(block.parts);
  }

  if ("delta" in block) {
    return extractMessageText(block.delta);
  }

  if ("value" in block) {
    return extractMessageText(block.value);
  }

  if ("output" in block) {
    return extractMessageText(block.output);
  }

  if ("message" in block) {
    return extractMessageText(block.message);
  }

  if ("items" in block) {
    return extractMessageText(block.items);
  }

  return "";
}
