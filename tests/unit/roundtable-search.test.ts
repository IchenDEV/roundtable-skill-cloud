import { describe, expect, it } from "vitest";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { parseRoundtableSearchParams } from "@/lib/roundtable/roundtable-search";

describe("parseRoundtableSearchParams", () => {
  it("parses fresh topic, skills, and max rounds", () => {
    expect(
      parseRoundtableSearchParams({
        topic: "  案由  ",
        skills: "a, b ,,c",
        maxRounds: "2.8",
      })
    ).toEqual({
      initialTopic: "案由",
      resumeSessionId: undefined,
      fromShareToken: undefined,
      initialSkillIds: ["a", "b", "c"],
      initialMaxRounds: 2,
    });
  });

  it("lets fromShare take precedence over resume", () => {
    const resume = "123e4567-e89b-12d3-a456-426614174000";
    const fromShare = "ABCDEF1234567890ABCDEF1234567890";
    expect(parseRoundtableSearchParams({ resume, fromShare })).toMatchObject({
      resumeSessionId: undefined,
      fromShareToken: fromShare.toLowerCase(),
    });
  });

  it("ignores invalid resume, share token, and max rounds", () => {
    expect(
      parseRoundtableSearchParams({
        resume: "not-a-session",
        fromShare: "not-a-share",
        maxRounds: String(MAX_ROUND_ROUNDS + 1),
      })
    ).toEqual({
      initialTopic: undefined,
      resumeSessionId: undefined,
      fromShareToken: undefined,
      initialSkillIds: [],
      initialMaxRounds: undefined,
    });
  });
});
