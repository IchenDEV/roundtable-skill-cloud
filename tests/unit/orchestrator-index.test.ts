import { describe, expect, it, vi } from "vitest";
import type { RunRoundtableParams } from "@/lib/spec/orchestrator-port";
import type { RoundtableState } from "@/lib/spec/schema";
import type { SkillManifest } from "@/lib/skills/types";

const graphMock = vi.hoisted(() =>
  vi.fn(async function* () {
    yield { type: "done" as const };
    return {
      topic: "x",
      round: 0,
      maxRounds: 1,
      phase: "done" as const,
      participantSkillIds: [],
      transcript: [],
      moderatorMemory: "",
    } satisfies RoundtableState;
  })
);

vi.mock("@/lib/orchestrator/run-roundtable-graph", () => ({
  runRoundtableGraph: graphMock,
}));

import { runRoundtableStream } from "@/lib/orchestrator";

describe("runRoundtableStream", () => {
  const manifest: SkillManifest = { generatedAt: "", skills: [] };
  const resolveLlm = vi.fn();

  const baseState = (): RunRoundtableParams["state"] => ({
    topic: "t",
    round: 0,
    maxRounds: 3,
    phase: "running",
    participantSkillIds: [],
    transcript: [],
    moderatorMemory: "",
  });

  it("delegates to graph", async () => {
    graphMock.mockClear();
    const params: RunRoundtableParams = {
      state: baseState(),
      manifest,
      resolveLlm,
    };
    const gen = runRoundtableStream(params);
    const first = await gen.next();
    expect(first.value).toEqual({ type: "done" });
    const done = await gen.next();
    expect(done.done).toBe(true);
    expect(graphMock).toHaveBeenCalled();
  });
});
