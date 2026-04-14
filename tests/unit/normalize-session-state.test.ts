import { describe, expect, it } from "vitest";

import { normalizeRoundtableState } from "@/lib/roundtable/normalize-session-state";
import type { RoundtableState } from "@/lib/spec/schema";

function base(overrides: Partial<RoundtableState> = {}): RoundtableState {
  return {
    mode: "discussion",
    topic: "题目",
    round: 1,
    maxRounds: 3,
    phase: "await_user",
    participantSkillIds: ["skill-a"],
    transcript: [{ role: "moderator", content: "甲", ts: "1" }],
    moderatorMemory: "",
    ...overrides,
  };
}

describe("normalizeRoundtableState", () => {
  it("maps running sessions to idle on resume", () => {
    expect(normalizeRoundtableState(base({ phase: "running" }), "resume").phase).toBe("idle");
  });

  it("leaves non-running sessions unchanged on resume", () => {
    expect(normalizeRoundtableState(base({ phase: "await_user" }), "resume").phase).toBe("await_user");
  });

  it("moves finished sessions back to await_user on fork and extends capped rounds", () => {
    const next = normalizeRoundtableState(base({ phase: "done", round: 3, maxRounds: 3 }), "fork");
    expect(next.phase).toBe("await_user");
    expect(next.maxRounds).toBe(5);
  });

  it("clears fork-only transient state", () => {
    const next = normalizeRoundtableState(base({ phase: "error", error: "e", userCommand: "stop" }), "fork");
    expect(next.error).toBeUndefined();
    expect(next.userCommand).toBeUndefined();
  });
});
