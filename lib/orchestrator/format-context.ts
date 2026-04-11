import type { TranscriptEntry } from "../spec/schema";

export function formatTranscript(
  entries: TranscriptEntry[],
  skillNames?: Record<string, string>,
  maxChars = 24000
): string {
  if (entries.length === 0) return "（尚无发言）";
  const lines = entries.map((e) => {
    const who =
      e.role === "moderator"
        ? "【主持】"
        : e.role === "speaker"
          ? `【${(e.skillId && skillNames?.[e.skillId]) || e.skillId || "发言者"}】`
          : e.role === "user"
            ? "【席上你我】"
            : "【系统】";
    return `${who}\n${e.content}`;
  });
  let text = lines.join("\n\n");
  if (text.length > maxChars) {
    text = "…（前略）…\n\n" + text.slice(-maxChars);
  }
  return text;
}
