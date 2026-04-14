import type { RoundtableState } from "@/lib/spec/schema";

export type RoundtableStateNormalizationMode = "resume" | "fork";

export function normalizeRoundtableState(
  state: RoundtableState,
  mode: RoundtableStateNormalizationMode
): RoundtableState {
  if (mode === "resume") {
    return state.phase === "running" ? { ...state, phase: "idle" } : state;
  }

  let maxRounds = state.maxRounds;
  let phase = state.phase;

  if (phase === "done" || phase === "error" || phase === "synthesis") {
    phase = "await_user";
    if (state.round >= maxRounds) maxRounds = state.round + 2;
  }
  if (phase === "running") phase = "idle";
  if (phase === "idle" && state.transcript.length > 0) phase = "await_user";

  return {
    ...state,
    phase,
    maxRounds,
    error: undefined,
    userCommand: undefined,
  };
}
