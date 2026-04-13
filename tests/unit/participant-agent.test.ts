import { describe, expect, it, vi } from "vitest";

const createReactAgent = vi.hoisted(() => vi.fn());
const createSkillTools = vi.hoisted(() => vi.fn(() => []));
const toLangChainModel = vi.hoisted(() => vi.fn(() => ({ tag: "model" })));

vi.mock("@langchain/langgraph/prebuilt", () => ({
  createReactAgent,
}));

vi.mock("@langchain/core/messages", () => ({
  AIMessage: class AIMessage {
    content: unknown;
    tool_calls: unknown[];

    constructor(content: unknown, toolCalls: unknown[] = []) {
      this.content = content;
      this.tool_calls = toolCalls;
    }

    getType() {
      return "ai";
    }
  },
  AIMessageChunk: class AIMessageChunk {
    content: unknown;
    tool_call_chunks: unknown[];

    constructor(content: unknown, toolCallChunks: unknown[] = []) {
      this.content = content;
      this.tool_call_chunks = toolCallChunks;
    }

    getType() {
      return "ai";
    }
  },
  ToolMessage: class ToolMessage {
    content: unknown;
    tool_call_id: string;

    constructor({ content, tool_call_id }: { content: unknown; tool_call_id: string }) {
      this.content = content;
      this.tool_call_id = tool_call_id;
    }

    getType() {
      return "tool";
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

  it("falls back to additional_kwargs content when chunk content is empty", async () => {
    const { AIMessageChunk } = await import("@langchain/core/messages");
    const stream = vi.fn().mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield [
          Object.assign(new AIMessageChunk(""), {
            additional_kwargs: { reasoning_content: "先想想", content: "再落笔" },
          }),
        ];
        yield [Object.assign(new AIMessageChunk(""), { additional_kwargs: { output_text: "。" } })];
      },
    });
    createReactAgent.mockReturnValue({ stream });

    const { events } = await drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲"));

    expect(events.filter((e) => (e as { type?: string }).type === "token")).toEqual([
      { type: "token", role: "speaker", skillId: "sk1", text: "再落笔" },
      { type: "token", role: "speaker", skillId: "sk1", text: "。" },
    ]);
    expect(events[events.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "再落笔。",
    });
  });

  it("accepts skills-superman paths and captures final AIMessage text after tool calls", async () => {
    const { AIMessage, ToolMessage } = await import("@langchain/core/messages");
    const supermanSkill = {
      ...skill,
      skillId: "sk2",
      dirPath: "skills-superman/skills/camus-perspective",
      entryPath: "skills-superman/skills/camus-perspective/SKILL.md",
    };
    const stream = vi.fn().mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield [new ToolMessage({ content: "SKILL.md contents", tool_call_id: "tool-1" })];
        yield [new AIMessage("荒诞并不取消行动。")];
      },
    });
    createReactAgent.mockReturnValue({ stream });

    const { events } = await drain(streamParticipantTurn(runtime, "gpt", supermanSkill, "记录", "加缪"));

    expect(createSkillTools).toHaveBeenCalledWith(
      expect.stringMatching(/skills-superman[\\/]+skills[\\/]+camus-perspective$/)
    );
    expect(events[events.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk2",
      fullText: "荒诞并不取消行动。",
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
