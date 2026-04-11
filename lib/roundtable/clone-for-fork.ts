import type { RoundtableState } from "@/lib/spec/schema";

/**
 * 从分享/展卷载入后生成新席：换新 sessionId，便于在本人名下续写；
 * 已结案时放宽 maxRounds 并置于候场，以便「再续一轮」。
 */
export function cloneStateForFork(s: RoundtableState): RoundtableState {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  let maxR = s.maxRounds;
  const r = s.round;
  let ph = s.phase;

  if (ph === "done" || ph === "error" || ph === "synthesis") {
    ph = "await_user";
    if (r >= maxR) maxR = r + 2;
  }
  if (ph === "running") ph = "idle";
  if (ph === "idle" && s.transcript.length > 0) ph = "await_user";

  return {
    ...s,
    sessionId: id,
    phase: ph,
    maxRounds: maxR,
    error: undefined,
    userCommand: undefined,
  };
}
