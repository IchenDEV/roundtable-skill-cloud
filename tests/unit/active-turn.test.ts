import { describe, expect, it } from "vitest";
import { buildModeratorActiveTurn, buildParticipantActiveTurn } from "@/lib/roundtable/active-turn";

describe("active turn helpers", () => {
  it("builds moderator turns", () => {
    expect(buildModeratorActiveTurn("moderator_open")).toEqual({
      step: "moderator_open",
      role: "moderator",
    });
    expect(buildModeratorActiveTurn("synthesis")).toEqual({
      step: "synthesis",
      role: "moderator",
    });
  });

  it("builds participant turns with target and directive", () => {
    expect(buildParticipantActiveTurn({ skillId: "a", target: "b", directive: "驳其前提" })).toEqual({
      step: "participant",
      role: "speaker",
      skillId: "a",
      target: "b",
      directive: "驳其前提",
    });
  });
});
