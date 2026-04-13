import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("repairs moderator output when it fabricates participant lines", async () => {
    const { streamChat, chatComplete } = await import("@/lib/llm/stream-chat");
    vi.mocked(streamChat).mockImplementationOnce(async function* () {
      yield "苏格拉底：先替他回答。";
    });
    vi.mocked(chatComplete).mockResolvedValueOnce("我只做主持追问：请两席分别回应对方最薄弱的一环。");

    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamModeratorTurn(runtime, "m", "sys", "user blob", ["苏格拉底", "韩非"]);

    const evs = [];
    let n = await gen.next();
    while (!n.done) {
      evs.push(n.value);
      n = await gen.next();
    }

    expect(vi.mocked(chatComplete)).toHaveBeenCalled();
    expect(evs[evs.length - 1]).toEqual({
      type: "turn_complete",
      role: "moderator",
      fullText: "我只做主持追问：请两席分别回应对方最薄弱的一环。",
    });
  });
});
