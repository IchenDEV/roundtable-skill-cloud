import { describe, expect, it, vi } from "vitest";
import type { SkillManifest } from "@/lib/skills/types";

vi.mock("@/lib/llm/stream-chat", () => ({
  streamChat: vi.fn(async function* () {
    yield "p";
  }),
}));

import { buildParticipantSystemPrompt, streamParticipantSkillAgent } from "@/lib/orchestrator/agents/participant-agent";

describe("participant-agent", () => {
  const skill: SkillManifest["skills"][0] = {
    skillId: "sk",
    name: "视角名",
    description: "",
    contentHash: "h",
    compiledPrompt: "PROMPT",
    rawPath: "/",
  };

  it("buildParticipantSystemPrompt embeds skill and transcript", () => {
    const s = buildParticipantSystemPrompt(skill, "【记录】");
    expect(s).toContain("PROMPT");
    expect(s).toContain("视角名");
    expect(s).toContain("【记录】");
  });

  it("streamParticipantSkillAgent yields completion", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamParticipantSkillAgent(runtime, "m", skill, "ctx");
    const evs = [];
    let n = await gen.next();
    while (!n.done) {
      evs.push(n.value);
      n = await gen.next();
    }
    expect(evs.some((e) => e.type === "turn_complete")).toBe(true);
  });
});
