import type { TranscriptEntry } from "../spec/schema";

function speakerLabel(e: TranscriptEntry, skillNames?: Record<string, string>): string {
  if (e.role === "moderator") return "【主持】";
  if (e.role === "speaker") return `【${(e.skillId && skillNames?.[e.skillId]) || e.skillId || "发言者"}】`;
  if (e.role === "user") return "【席上你我】";
  return "【系统】";
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return "…（前略）…\n\n" + text.slice(-maxChars);
}

/** 通用 transcript 格式化（主持人视角，所有人平等展示） */
export function formatTranscript(
  entries: TranscriptEntry[],
  skillNames?: Record<string, string>,
  maxChars = 24000
): string {
  if (entries.length === 0) return "（尚无发言）";
  const lines = entries.map((e) => `${speakerLabel(e, skillNames)}\n${e.content}`);
  return truncate(lines.join("\n\n"), maxChars);
}

/**
 * 按席定制的 transcript 格式化——本席发言前加 ★ 标记，强化身份锚定。
 * 用于列席代理的 user message。
 */
export function formatTranscriptForSeat(
  entries: TranscriptEntry[],
  mySkillId: string,
  skillNames?: Record<string, string>,
  maxChars = 24000
): string {
  if (entries.length === 0) return "（尚无发言）";
  const lines = entries.map((e) => {
    const label = speakerLabel(e, skillNames);
    const isMine = e.role === "speaker" && e.skillId === mySkillId;
    const prefix = isMine ? `★${label}（你的前次发言）` : label;
    return `${prefix}\n${e.content}`;
  });
  return truncate(lines.join("\n\n"), maxChars);
}
