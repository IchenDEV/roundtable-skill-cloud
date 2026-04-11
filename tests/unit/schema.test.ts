import { describe, expect, it } from "vitest";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { roundtableStateSchema, streamEventSchema, userCredentialInputSchema } from "@/lib/spec/schema";

describe("roundtableStateSchema", () => {
  it("accepts minimal valid state", () => {
    const s = {
      topic: "议题",
      round: 0,
      maxRounds: 2,
      phase: "idle" as const,
      participantSkillIds: ["a"],
      transcript: [],
      moderatorMemory: "",
    };
    expect(roundtableStateSchema.safeParse(s).success).toBe(true);
  });

  it("rejects maxRounds above platform cap", () => {
    expect(
      roundtableStateSchema.safeParse({
        topic: "t",
        round: 0,
        maxRounds: MAX_ROUND_ROUNDS + 1,
        phase: "idle",
        participantSkillIds: [],
        transcript: [],
        moderatorMemory: "",
      }).success
    ).toBe(false);
  });

  it("rejects negative round", () => {
    expect(
      roundtableStateSchema.safeParse({
        topic: "t",
        round: -1,
        maxRounds: 1,
        phase: "idle",
        participantSkillIds: [],
        transcript: [],
        moderatorMemory: "",
      }).success
    ).toBe(false);
  });
});

describe("streamEventSchema", () => {
  it("parses token and done", () => {
    expect(streamEventSchema.safeParse({ type: "token", role: "moderator", text: "a" }).success).toBe(true);
    expect(streamEventSchema.safeParse({ type: "done" }).success).toBe(true);
  });
});

describe("userCredentialInputSchema", () => {
  it("accepts openai with key only", () => {
    const ok = userCredentialInputSchema.safeParse({
      provider: "openai",
      apiKey: "1234567890123456",
    });
    expect(ok.success).toBe(true);
  });
});
