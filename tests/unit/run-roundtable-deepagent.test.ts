import { describe, expect, it, vi } from "vitest";
import type { RunRoundtableParams } from "@/lib/spec/orchestrator-port";
import type { RoundtableState } from "@/lib/spec/schema";
import type { SkillManifest } from "@/lib/skills/types";

const final: RoundtableState = {
  topic: "t",
  round: 0,
  maxRounds: 1,
  phase: "done",
  participantSkillIds: [],
  transcript: [],
  moderatorMemory: "",
};

vi.mock("@/lib/orchestrator/run-roundtable-graph", () => ({
  runRoundtableGraph: vi.fn(async function* () {
    yield { type: "done" as const };
    return final;
  }),
}));

import { runRoundtableDeepAgent } from "@/lib/orchestrator/run-roundtable-deepagent";

describe("runRoundtableDeepAgent", () => {
  it("delegates to runRoundtableGraph", async () => {
    const manifest: SkillManifest = { generatedAt: "", skills: [] };
    const params: RunRoundtableParams = {
      state: final,
      manifest,
      moderatorPrompt: "",
      resolveLlm: vi.fn(),
    };
    const gen = runRoundtableDeepAgent(params);
    let n = await gen.next();
    while (!n.done) {
      n = await gen.next();
    }
    expect(n.value).toEqual(final);
  });
});
