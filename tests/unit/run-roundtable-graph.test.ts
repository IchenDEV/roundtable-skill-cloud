import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunRoundtableParams } from "@/lib/spec/orchestrator-port";
import type { SkillManifest } from "@/lib/skills/types";

vi.mock("@/lib/orchestrator/moderator-load", () => ({
  loadModeratorPrompt: () => "MOD_PROMPT",
}));

vi.mock("@/lib/orchestrator/agents/moderator-agent", () => ({
  streamModeratorOpening: vi.fn(async function* () {
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "open" };
  }),
  streamModeratorSynthesis: vi.fn(async function* () {
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "syn" };
  }),
  streamModeratorWrap: vi.fn(async function* () {
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "wrap" };
  }),
  summarizeModeratorMemory: vi.fn(async () => "memory"),
}));

vi.mock("@/lib/orchestrator/agents/participant-agent", () => ({
  streamParticipantSkillAgent: vi.fn(async function* () {
    yield { type: "turn_complete" as const, role: "speaker" as const, skillId: "sk1", fullText: "spoke" };
  }),
}));

import { runRoundtableGraph } from "@/lib/orchestrator/run-roundtable-graph";

describe("runRoundtableGraph", () => {
  const manifest: SkillManifest = {
    generatedAt: "g",
    skills: [
      {
        skillId: "sk1",
        name: "S",
        description: "",
        contentHash: "h",
        compiledPrompt: "p",
        rawPath: "/",
      },
    ],
  };

  const resolveLlm = vi.fn().mockResolvedValue({
    runtime: { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const },
    model: "m",
  });

  beforeEach(() => {
    resolveLlm.mockClear();
  });

  it("runs synthesis path when userCommand is stop", async () => {
    const params: RunRoundtableParams = {
      state: {
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["sk1"],
        transcript: [],
        moderatorMemory: "",
        userCommand: "stop",
      },
      manifest,
      moderatorPrompt: "",
      resolveLlm,
    };
    const gen = runRoundtableGraph(params);
    const events = [];
    let n = await gen.next();
    while (!n.done) {
      events.push(n.value);
      n = await gen.next();
    }
    const final = n.value;
    expect(final.phase).toBe("done");
    expect(final.synthesis).toBe("syn");
    expect(events.some((e) => e.type === "synthesis_complete")).toBe(true);
  });

  it("runs one round with participants then await_user", async () => {
    const params: RunRoundtableParams = {
      state: {
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["sk1"],
        transcript: [],
        moderatorMemory: "",
      },
      manifest,
      moderatorPrompt: "",
      resolveLlm,
    };
    const gen = runRoundtableGraph(params);
    let n = await gen.next();
    while (!n.done) {
      n = await gen.next();
    }
    const final = n.value;
    expect(final.phase).toBe("await_user");
    expect(final.round).toBe(1);
    expect(final.transcript.some((t) => t.role === "speaker")).toBe(true);
  });

  it("errors on unknown skill", async () => {
    const params: RunRoundtableParams = {
      state: {
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["missing"],
        transcript: [],
        moderatorMemory: "",
      },
      manifest,
      moderatorPrompt: "",
      resolveLlm,
    };
    const gen = runRoundtableGraph(params);
    let sawError = false;
    let n = await gen.next();
    while (!n.done) {
      if (n.value.type === "error") sawError = true;
      n = await gen.next();
    }
    expect(sawError).toBe(true);
    expect(n.value.phase).toBe("error");
  });
});
