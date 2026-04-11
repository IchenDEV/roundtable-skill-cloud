import { describe, expect, it } from "vitest";
import { sharePayloadSchema } from "@/lib/spec/share-payload";

describe("sharePayloadSchema", () => {
  it("parses v1 payload", () => {
    const p = sharePayloadSchema.safeParse({
      v: 1,
      state: {
        topic: "t",
        round: 0,
        maxRounds: 2,
        phase: "done",
        participantSkillIds: [],
        transcript: [],
        moderatorMemory: "",
      },
      skillNames: { a: "A" },
    });
    expect(p.success).toBe(true);
  });
});
