import { describe, expect, it, vi } from "vitest";

const createReactAgent = vi.hoisted(() => vi.fn());
const createSkillTools = vi.hoisted(() => vi.fn(() => []));
const toLangChainModel = vi.hoisted(() => vi.fn(() => ({ tag: "model" })));

vi.mock("@langchain/langgraph/prebuilt", () => ({
  createReactAgent,
}));

vi.mock("@langchain/core/messages", () => ({
  AIMessageChunk: class AIMessageChunk {
    content: unknown;
    tool_call_chunks: unknown[];

    constructor(content: unknown, toolCallChunks: unknown[] = []) {
      this.content = content;
      this.tool_call_chunks = toolCallChunks;
    }
  },
}));

vi.mock("@/lib/llm/to-langchain-model", () => ({
  toLangChainModel,
}));

vi.mock("@/lib/orchestrator/agents/skill-tools", () => ({
  createSkillTools,
}));

import { streamDebateParticipantTurn, streamParticipantTurn } from "@/lib/orchestrator/agents/participant-agent";

async function drain(gen: AsyncGenerator<unknown, unknown>) {
  const out: unknown[] = [];
  let n = await gen.next();
  while (!n.done) {
    out.push(n.value);
    n = await gen.next();
  }
  return { events: out, final: n.value };
}

describe("participant-agent", () => {
  const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "https://x", provider: "openai" as const };
  const skill = {
    skillId: "sk1",
    name: "甲",
    description: "",
    contentHash: "h",
    dirPath: "skills/paul-graham-perspective",
    entryPath: "skills/paul-graham-perspective/SKILL.md",
  };

  it("streams visible assistant text and forwards the abort signal", async () => {
    const { AIMessageChunk } = await import("@langchain/core/messages");
    const stream = vi.fn().mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield [new AIMessageChunk("hidden", [{}])];
        yield [new AIMessageChunk("你")];
        yield [new AIMessageChunk("好")];
      },
    });
    createReactAgent.mockReturnValue({ stream });

    const signal = new AbortController().signal;
    const { events } = await drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲", signal));

    expect(toLangChainModel).toHaveBeenCalledWith(runtime, "gpt");
    expect(createSkillTools).toHaveBeenCalled();
    expect(stream).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ signal }));
    expect(events.filter((e) => (e as { type?: string }).type === "token")).toHaveLength(2);
    expect(events[events.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "你好",
    });
  });

  it("extracts visible text from structured content blocks", async () => {
    const { AIMessageChunk } = await import("@langchain/core/messages");
    const stream = vi.fn().mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield [
          new AIMessageChunk([
            { type: "text", text: "其" },
            { type: "tool_use", text: "hidden" },
            { type: "text", text: "实" },
          ]),
        ];
        yield [new AIMessageChunk({ type: "content_block", content: [{ type: "text", text: "不空" }] })];
      },
    });
    createReactAgent.mockReturnValue({ stream });

    const { events } = await drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲"));

    expect(events.filter((e) => (e as { type?: string }).type === "token")).toEqual([
      { type: "token", role: "speaker", skillId: "sk1", text: "其实" },
      { type: "token", role: "speaker", skillId: "sk1", text: "不空" },
    ]);
    expect(events[events.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "其实不空",
    });
  });

  it("throws a skill-scoped error on non-abort failures", async () => {
    createReactAgent.mockReturnValue({
      stream: vi.fn().mockRejectedValue(new Error("boom")),
    });

    await expect(
      drain(streamDebateParticipantTurn(runtime, "gpt", skill, "记录", "甲", "乙", "驳其前提"))
    ).rejects.toThrow("[sk1] boom");
  });

  it("stops quietly on abort", async () => {
    createReactAgent.mockReturnValue({
      stream: vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })),
    });

    const controller = new AbortController();
    controller.abort();
    const { events } = await drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲", controller.signal));
    expect(events).toEqual([]);
  });
});
