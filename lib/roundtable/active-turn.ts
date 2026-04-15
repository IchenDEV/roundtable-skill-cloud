import type { DebateAction, TurnStep } from "@/lib/spec/schema";

export type RoundtableActiveTurn = {
  step: TurnStep;
  role: "moderator" | "speaker";
  skillId?: string;
  target?: string;
  directive?: string;
  action?: DebateAction;
} | null;

export type ActiveTurnInput = {
  skillId?: string;
  target?: string;
  directive?: string;
  action?: DebateAction;
};

export function buildModeratorActiveTurn(
  step: Extract<TurnStep, "moderator_open" | "moderator_judge" | "moderator_wrap" | "synthesis">,
  input?: Pick<ActiveTurnInput, "target" | "directive" | "action">
) {
  return {
    step,
    role: "moderator" as const,
    target: input?.target,
    directive: input?.directive,
    action: input?.action,
  };
}

export function buildParticipantActiveTurn(input: ActiveTurnInput) {
  return {
    step: "participant" as const,
    role: "speaker" as const,
    skillId: input.skillId,
    target: input.target,
    directive: input.directive,
    action: input.action,
  };
}
