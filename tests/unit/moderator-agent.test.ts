import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/llm/stream-chat", () => ({
  streamChat: vi.fn(async function* () {
    yield "x";
  }),
  chatComplete: vi.fn().mockResolvedValue("compressed memory text"),
}));

import {
  streamModeratorTurn,
  streamModeratorSynthesis,
  summarizeModeratorMemory,
} from "@/lib/orchestrator/agents/moderator-agent";

describe("moderator-agent", () => {
  it("streamModeratorTurn (opening) completes", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamModeratorTurn(runtime, "m", "sys", "user blob");
    const evs = [];
    let n = await gen.next();
    while (!n.done) {
      evs.push(n.value);
      n = await gen.next();
    }
    expect(evs.some((e) => e.type === "turn_complete")).toBe(true);
  });

  it("streamModeratorTurn (wrap) completes", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamModeratorTurn(runtime, "m", "sys", "wrap blob");
    let n = await gen.next();
    while (!n.done) {
      n = await gen.next();
    }
    expect(n.done).toBe(true);
  });

  it("streamModeratorSynthesis completes", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamModeratorSynthesis(runtime, "m", "syn blob");
    let n = await gen.next();
    while (!n.done) {
      n = await gen.next();
    }
    expect(n.done).toBe(true);
  });

  it("summarizeModeratorMemory slices result", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const mem = await summarizeModeratorMemory(runtime, "m", "wrap text");
    expect(mem).toBe("compressed memory text");
  });
});
