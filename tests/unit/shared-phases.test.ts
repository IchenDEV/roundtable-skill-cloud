import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/orchestrator/agents/moderator-agent", () => ({
  streamModeratorSynthesis: vi.fn(async function* () {
    yield { type: "token" as const, role: "moderator" as const, text: "s" };
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "syn" };
  }),
}));

import { runSynthesisPhase } from "@/lib/orchestrator/shared-phases";
import type { RoundtableState } from "@/lib/spec/schema";

describe("runSynthesisPhase", () => {
  it("streams synthesis and returns done state", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "https://x", provider: "openai" as const };
    const state: RoundtableState = {
      mode: "discussion",
      topic: "议题",
      round: 2,
      maxRounds: 3,
      phase: "running",
      participantSkillIds: ["a"],
      transcript: [{ role: "moderator", content: "开场", ts: "1" }],
      moderatorMemory: "",
    };

    const gen = runSynthesisPhase(runtime, "gpt", "MOD", state, { a: "甲" });
    const out = [];
    let n = await gen.next();
    while (!n.done) {
      out.push(n.value);
      n = await gen.next();
    }

    expect(out.some((e) => e.type === "synthesis_complete")).toBe(true);
    expect(n.value.phase).toBe("done");
    expect(n.value.synthesis).toBe("syn");
  });
});
