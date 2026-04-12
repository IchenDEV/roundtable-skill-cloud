import type { TurnStep } from "@/lib/spec/schema";

export type RoundtableActiveTurn = {
  step: TurnStep;
  role: "moderator" | "speaker";
  skillId?: string;
  target?: string;
  directive?: string;
} | null;

export type ActiveTurnInput = {
  skillId?: string;
  target?: string;
  directive?: string;
};

export function buildModeratorActiveTurn(step: Extract<TurnStep, "moderator_open" | "moderator_wrap" | "synthesis">) {
  return { step, role: "moderator" as const };
}

export function buildParticipantActiveTurn(input: ActiveTurnInput) {
  return {
    step: "participant" as const,
    role: "speaker" as const,
    skillId: input.skillId,
    target: input.target,
    directive: input.directive,
  };
}
