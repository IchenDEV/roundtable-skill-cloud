import type { DispatchStep, RoundtableRunCheckpoint, RoundtableState, TurnStep } from "@/lib/spec/schema";

export const STREAM_INTERRUPTED_MESSAGE =
  "连接中断，刚才屏幕上未完成的文字不会记入旧席；点击继续会从上一条完整发言后再试。";

export const RESUME_CHECKPOINT_MESSAGE = "上次对话在执行中断开。已保留上一条完整发言，点击继续会从下一步再试。";

function timestamp() {
  return new Date().toISOString();
}

export function createRoundCheckpoint(
  nextStep: TurnStep = "moderator_open",
  options: { steps?: DispatchStep[]; stepIndex?: number; message?: string } = {}
): RoundtableRunCheckpoint {
  return {
    kind: "round",
    nextStep,
    steps: options.steps,
    stepIndex: options.stepIndex,
    message: options.message,
    updatedAt: timestamp(),
  };
}

export function createSynthesisCheckpoint(message?: string): RoundtableRunCheckpoint {
  return {
    kind: "synthesis",
    nextStep: "synthesis",
    message,
    updatedAt: timestamp(),
  };
}

export function checkpointForStep(steps: DispatchStep[], stepIndex: number): RoundtableRunCheckpoint {
  if (stepIndex >= steps.length) {
    return createRoundCheckpoint("moderator_wrap", { steps, stepIndex });
  }

  return createRoundCheckpoint(steps[stepIndex]?.action === "judge" ? "moderator_judge" : "participant", {
    steps,
    stepIndex,
  });
}

export function markStateRunning(state: RoundtableState, runCheckpoint: RoundtableRunCheckpoint): RoundtableState {
  return {
    ...state,
    phase: "running",
    error: undefined,
    runCheckpoint,
  };
}

export function markStateInterrupted(state: RoundtableState, message: string): RoundtableState {
  return {
    ...state,
    phase: "error",
    error: message,
    runCheckpoint: state.runCheckpoint
      ? {
          ...state.runCheckpoint,
          message,
          updatedAt: timestamp(),
        }
      : state.runCheckpoint,
  };
}
