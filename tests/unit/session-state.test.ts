import { describe, expect, it } from "vitest";
import {
  buildEmptyState,
  buildSessionErrorState,
  clampMaxRounds,
  pickSelectedSkillIds,
} from "@/lib/roundtable/session-state";

describe("session-state", () => {
  const skills = [
    { skillId: "a", name: "A", description: "", category: "哲学思想" },
    { skillId: "b", name: "B", description: "", category: "商业投资" },
  ];

  it("filters selected skills against available ids", () => {
    expect(pickSelectedSkillIds(["a", "missing", "b"], skills)).toEqual(["a", "b"]);
  });

  it("builds an error state shell", () => {
    expect(buildSessionErrorState("session-id", "discussion", "题目", "失败")).toMatchObject({
      sessionId: "session-id",
      mode: "discussion",
      topic: "题目",
      phase: "error",
      error: "失败",
      participantSkillIds: [],
      transcript: [],
    });
  });

  it("clamps empty state max rounds to the supported limit", () => {
    expect(buildEmptyState("题目", ["a"], 99, "id", "debate")).toMatchObject({
      topic: "题目",
      participantSkillIds: ["a"],
      maxRounds: 8,
      phase: "running",
      mode: "debate",
    });
  });

  it("normalizes optional max rounds for UI state", () => {
    expect(clampMaxRounds()).toBe(3);
    expect(clampMaxRounds(2)).toBe(2);
    expect(clampMaxRounds(99)).toBe(8);
  });
});
