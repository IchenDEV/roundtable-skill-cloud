import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunRoundtableParams } from "@/lib/spec/orchestrator-port";
import type { SkillManifest } from "@/lib/skills/types";

vi.mock("@/lib/orchestrator/moderator-load", () => ({
  loadModeratorDebatePrompt: () => "MOD_DEBATE_PROMPT",
}));

vi.mock("@/lib/orchestrator/agents/moderator-agent", () => ({
  streamModeratorTurn: vi.fn(async function* (_runtime, _model, _prompt, userContent: string) {
    if (userContent.includes("JSON 格式")) {
      yield {
        type: "turn_complete" as const,
        role: "moderator" as const,
        fullText:
          '开场\n```json:dispatch\n[{"skillId":"sk1","target":"sk2","directive":"驳其前提"},{"skillId":"sk2"}]\n```',
      };
      return;
    }
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "wrap" };
  }),
  streamModeratorSynthesis: vi.fn(async function* () {
    yield { type: "turn_complete" as const, role: "moderator" as const, fullText: "syn" };
  }),
  summarizeModeratorMemory: vi.fn(async () => "memory"),
}));

vi.mock("@/lib/orchestrator/agents/participant-agent", () => ({
  streamDebateParticipantTurn: vi.fn(async function* (_runtime, _model, skill) {
    yield {
      type: "turn_complete" as const,
      role: "speaker" as const,
      skillId: skill.skillId,
      fullText: `spoke:${skill.skillId}`,
    };
  }),
}));

import { runRoundtableDebate } from "@/lib/orchestrator/run-roundtable-debate";

describe("runRoundtableDebate", () => {
  const manifest: SkillManifest = {
    generatedAt: "g",
    skills: [
      {
        skillId: "sk1",
        name: "甲",
        description: "",
        contentHash: "h1",
        dirPath: "skills/sk1",
        entryPath: "skills/sk1/SKILL.md",
      },
      {
        skillId: "sk2",
        name: "乙",
        description: "",
        contentHash: "h2",
        dirPath: "skills/sk2",
        entryPath: "skills/sk2/SKILL.md",
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

  it("runs synthesis path when stop requested", async () => {
    const params: RunRoundtableParams = {
      state: {
        mode: "debate",
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["sk1", "sk2"],
        transcript: [],
        moderatorMemory: "",
        userCommand: "stop",
      },
      manifest,
      resolveLlm,
    };
    const gen = runRoundtableDebate(params);
    const events = [];
    let n = await gen.next();
    while (!n.done) {
      events.push(n.value);
      n = await gen.next();
    }
    expect(events.some((e) => e.type === "synthesis_complete")).toBe(true);
    expect(n.value.phase).toBe("done");
  });

  it("runs one debate round then awaits user", async () => {
    const params: RunRoundtableParams = {
      state: {
        mode: "debate",
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["sk1", "sk2"],
        transcript: [],
        moderatorMemory: "",
      },
      manifest,
      resolveLlm,
    };
    const gen = runRoundtableDebate(params);
    let n = await gen.next();
    while (!n.done) {
      n = await gen.next();
    }
    expect(n.value.phase).toBe("await_user");
    expect(n.value.round).toBe(1);
    expect(n.value.transcript.filter((t) => t.role === "speaker")).toHaveLength(2);
  });

  it("errors on unknown dispatched skill", async () => {
    const params: RunRoundtableParams = {
      state: {
        mode: "debate",
        topic: "T",
        round: 0,
        maxRounds: 3,
        phase: "running",
        participantSkillIds: ["missing"],
        transcript: [],
        moderatorMemory: "",
      },
      manifest,
      resolveLlm,
    };
    const gen = runRoundtableDebate(params);
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
