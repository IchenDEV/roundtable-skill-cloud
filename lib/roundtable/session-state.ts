import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import type { RoundtableState } from "@/lib/spec/schema";

export type SkillOption = {
  skillId: string;
  name: string;
  description: string;
  category: string;
};

export type SessionMode = RoundtableState["mode"];

export function pickSelectedSkillIds(ids: string[], skills: SkillOption[]) {
  return ids.filter((id) => skills.some((skill) => skill.skillId === id));
}

export function buildSessionErrorState(
  sessionId: string,
  mode: SessionMode,
  topic: string,
  error: string
): RoundtableState {
  return {
    sessionId,
    mode,
    topic,
    round: 0,
    maxRounds: 3,
    phase: "error",
    participantSkillIds: [],
    transcript: [],
    moderatorMemory: "",
    error,
  };
}

export function buildEmptyState(
  topic: string,
  participantSkillIds: string[],
  maxRounds: number,
  sessionId: string,
  mode: SessionMode
): RoundtableState {
  return {
    sessionId,
    mode,
    topic,
    round: 0,
    maxRounds: Math.min(maxRounds, MAX_ROUND_ROUNDS),
    phase: "running",
    participantSkillIds,
    transcript: [],
    moderatorMemory: "",
  };
}

export function clampMaxRounds(maxRounds?: number) {
  return maxRounds ? Math.min(maxRounds, MAX_ROUND_ROUNDS) : 3;
}
