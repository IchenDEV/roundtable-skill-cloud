import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/llm/stream-chat", () => ({
  streamChat: vi.fn(async function* () {
    yield "a";
    yield "b";
  }),
}));

import { streamLlmTurn } from "@/lib/orchestrator/agents/llm-stream";

describe("streamLlmTurn", () => {
  it("yields tokens then turn_complete", async () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const gen = streamLlmTurn(runtime, "m", "moderator", undefined, [{ role: "user", content: "hi" }]);
    const out = [];
    let n = await gen.next();
    while (!n.done) {
      out.push(n.value);
      n = await gen.next();
    }
    expect(out.filter((e) => e.type === "token").length).toBe(2);
    const last = out[out.length - 1];
    expect(last.type).toBe("turn_complete");
    if (last.type === "turn_complete") {
      expect(last.fullText).toBe("ab");
    }
  });
});
