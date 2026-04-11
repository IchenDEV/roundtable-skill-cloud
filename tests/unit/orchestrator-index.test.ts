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

const deepMock = vi.hoisted(() =>
  vi.fn(async function* () {
    yield { type: "done" as const };
    return {
      topic: "deep",
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

vi.mock("@/lib/orchestrator/run-roundtable-deepagent", () => ({
  runRoundtableDeepAgent: deepMock,
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

  it("delegates to graph by default", async () => {
    graphMock.mockClear();
    const params: RunRoundtableParams = {
      state: baseState(),
      manifest,
      moderatorPrompt: "",
      resolveLlm,
    };
    const gen = runRoundtableStream(params);
    const first = await gen.next();
    expect(first.value).toEqual({ type: "done" });
    const done = await gen.next();
    expect(done.done).toBe(true);
    expect(graphMock).toHaveBeenCalled();
  });

  it("uses deepagent path when mode deepagent and not stop-like", async () => {
    deepMock.mockClear();
    graphMock.mockClear();
    const params: RunRoundtableParams = {
      state: baseState(),
      manifest,
      moderatorPrompt: "",
      resolveLlm,
      mode: "deepagent",
    };
    const gen = runRoundtableStream(params);
    while (true) {
      const n = await gen.next();
      if (n.done) break;
    }
    expect(deepMock).toHaveBeenCalled();
  });

  it("uses graph when stop-like even in deepagent mode", async () => {
    graphMock.mockClear();
    deepMock.mockClear();
    const params: RunRoundtableParams = {
      state: { ...baseState(), userCommand: "stop" },
      manifest,
      moderatorPrompt: "",
      resolveLlm,
      mode: "deepagent",
    };
    const gen = runRoundtableStream(params);
    while (true) {
      const n = await gen.next();
      if (n.done) break;
    }
    expect(graphMock).toHaveBeenCalled();
    expect(deepMock).not.toHaveBeenCalled();
  });
});
