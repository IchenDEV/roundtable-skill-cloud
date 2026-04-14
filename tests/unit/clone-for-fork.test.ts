import { describe, expect, it } from "vitest";
import { cloneStateForFork } from "@/lib/roundtable/clone-for-fork";
import type { RoundtableState } from "@/lib/spec/schema";

function base(over: Partial<RoundtableState>): RoundtableState {
  return {
    mode: "discussion",
    topic: "t",
    round: 1,
    maxRounds: 3,
    phase: "await_user",
    participantSkillIds: ["a"],
    transcript: [{ role: "moderator", content: "x", ts: "1" }],
    moderatorMemory: "",
    ...over,
  };
}

describe("cloneStateForFork", () => {
  it("assigns new sessionId and clears error/command", () => {
    const s = base({
      sessionId: "00000000-0000-4000-8000-000000000001",
      phase: "await_user",
      error: "e",
      userCommand: "stop",
    });
    const c = cloneStateForFork(s);
    expect(c.sessionId).toBeDefined();
    expect(c.sessionId).not.toBe(s.sessionId);
    expect(c.error).toBeUndefined();
    expect(c.userCommand).toBeUndefined();
  });

  it("extends maxRounds when done with round at cap", () => {
    const c = cloneStateForFork(
      base({ phase: "done", round: 3, maxRounds: 3, transcript: [{ role: "moderator", content: "x", ts: "1" }] })
    );
    expect(c.phase).toBe("await_user");
    expect(c.maxRounds).toBeGreaterThan(3);
  });

  it("maps running to idle", () => {
    const c = cloneStateForFork(base({ phase: "running", transcript: [] }));
    expect(c.phase).toBe("idle");
  });

  it("maps idle with transcript to await_user", () => {
    const c = cloneStateForFork(base({ phase: "idle" }));
    expect(c.phase).toBe("await_user");
  });
});
