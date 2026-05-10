import type { RoundtableState } from "@/lib/spec/schema";
import { RESUME_CHECKPOINT_MESSAGE } from "@/lib/roundtable/run-checkpoint";

export type RoundtableStateNormalizationMode = "resume" | "fork";

export function normalizeRoundtableState(
  state: RoundtableState,
  mode: RoundtableStateNormalizationMode
): RoundtableState {
  if (mode === "resume") {
    if (state.runCheckpoint) {
      return {
        ...state,
        phase: "error",
        error: state.error ?? state.runCheckpoint.message ?? RESUME_CHECKPOINT_MESSAGE,
      };
    }
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
    runCheckpoint: undefined,
    userCommand: undefined,
  };
}
