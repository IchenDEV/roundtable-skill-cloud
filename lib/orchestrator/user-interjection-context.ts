import type { TranscriptEntry, TurnStep } from "../spec/schema";

type InterjectionStep = Extract<TurnStep, "moderator_open" | "participant" | "moderator_wrap">;

function findLastModeratorIndex(entries: TranscriptEntry[], beforeExclusive = entries.length): number {
  for (let i = beforeExclusive - 1; i >= 0; i -= 1) {
    if (entries[i]?.role === "moderator") return i;
  }
  return -1;
}

function slicePendingUserEntries(entries: TranscriptEntry[], step: InterjectionStep): TranscriptEntry[] {
  if (step === "moderator_open") {
    const lastModerator = findLastModeratorIndex(entries);
    return entries.slice(lastModerator + 1).filter((entry) => entry.role === "user");
  }

  const currentRoundOpen = findLastModeratorIndex(entries);
  if (currentRoundOpen === -1) return [];
  const previousRoundWrap = findLastModeratorIndex(entries, currentRoundOpen);
  return entries.slice(previousRoundWrap + 1, currentRoundOpen).filter((entry) => entry.role === "user");
}

export function hasPendingUserInterjection(entries: TranscriptEntry[], step: InterjectionStep): boolean {
  return slicePendingUserEntries(entries, step).length > 0;
}

export function buildUserInterjectionNote(entries: TranscriptEntry[], step: InterjectionStep): string {
  const pending = slicePendingUserEntries(entries, step);
  if (pending.length === 0) {
    return "本轮新增席上插话：无。本轮不得虚构用户发言，也不得假定用户刚刚补充了观点。若前文出现过更早的【席上你我】，只能把它当旧话引用，不能假装它是刚发生的。";
  }

  const latest = pending[pending.length - 1];
  return `本轮新增席上插话：有。你必须回应最近一则【席上你我】发言，但不得替用户扩写、续写或改写：\n${latest?.content ?? ""}`;
}
