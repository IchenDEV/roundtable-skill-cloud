import { describe, expect, it, vi } from "vitest";

const createDeepAgent = vi.hoisted(() => vi.fn());
const toLangChainModel = vi.hoisted(() => vi.fn(() => ({ tag: "model" })));

vi.mock("deepagents", () => ({
  createDeepAgent,
  FilesystemBackend: class FilesystemBackend {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- constructor shape mirrors real backend
    constructor(_opts: unknown) {}
  },
}));

vi.mock("@langchain/core/messages", () => ({
  AIMessageChunk: class AIMessageChunk {
    content: string;
    tool_call_chunks: unknown[];

    constructor(content: string, toolCallChunks: unknown[] = []) {
      this.content = content;
      this.tool_call_chunks = toolCallChunks;
    }
  },
}));

vi.mock("@/lib/llm/to-langchain-model", () => ({
  toLangChainModel,
}));

import {
  streamDebateParticipantDeepAgent,
  streamParticipantDeepAgent,
} from "@/lib/orchestrator/agents/participant-deepagent";

describe("participant-deepagent", () => {
  const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "https://x", provider: "openai" as const };
  const skill = {
    skillId: "sk1",
    name: "甲",
    description: "",
    contentHash: "h",
    dirPath: "skills/paul-graham-perspective",
    entryPath: "skills/paul-graham-perspective/SKILL.md",
  };

  it("streams visible assistant text and skips tool-call chunks", async () => {
    const { AIMessageChunk } = await import("@langchain/core/messages");
    createDeepAgent.mockResolvedValue({
      stream: vi.fn().mockResolvedValue({
        async *[Symbol.asyncIterator]() {
          yield [new AIMessageChunk("hidden", [{}])];
          yield [new AIMessageChunk("你")];
          yield [new AIMessageChunk("好")];
        },
      }),
    });

    const gen = streamParticipantDeepAgent(runtime, "gpt", skill, "记录");
    const out = [];
    let n = await gen.next();
    while (!n.done) {
      out.push(n.value);
      n = await gen.next();
    }

    expect(toLangChainModel).toHaveBeenCalledWith(runtime, "gpt");
    expect(out.filter((e) => e.type === "token").map((e) => (e.type === "token" ? e.text : ""))).toEqual(["你", "好"]);
    expect(out[out.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "你好",
    });
  });

  it("yields error event when agent stream fails", async () => {
    createDeepAgent.mockResolvedValue({
      stream: vi.fn().mockRejectedValue(new Error("boom")),
    });

    const gen = streamDebateParticipantDeepAgent(runtime, "gpt", skill, "记录", "乙", "驳其前提");
    const out = [];
    let n = await gen.next();
    while (!n.done) {
      out.push(n.value);
      n = await gen.next();
    }

    expect(out.some((e) => e.type === "error" && e.message.includes("[sk1] boom"))).toBe(true);
    expect(out[out.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "",
    });
  });
});
