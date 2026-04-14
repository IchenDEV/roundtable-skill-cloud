import type { RoundtableState } from "@/lib/spec/schema";
import { normalizeRoundtableState } from "./normalize-session-state";

/**
 * 从分享/展卷载入后生成新席：换新 sessionId，便于在本人名下续写；
 * 已结案时放宽 maxRounds 并置于候场，以便「再续一轮」。
 */
export function cloneStateForFork(s: RoundtableState): RoundtableState {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    ...normalizeRoundtableState(s, "fork"),
    sessionId: id,
  };
}
