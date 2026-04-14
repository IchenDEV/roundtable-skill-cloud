import { beforeEach, describe, expect, it, vi } from "vitest";

const createReactAgent = vi.hoisted(() => vi.fn());
const createSkillTools = vi.hoisted(() => vi.fn(() => []));
const toLangChainModel = vi.hoisted(() => vi.fn(() => ({ tag: "model" })));
const chatComplete = vi.hoisted(() => vi.fn());

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

    getType() {
      return "ai";
    }
  },
}));

vi.mock("@/lib/llm/to-langchain-model", () => ({
  toLangChainModel,
}));

vi.mock("@/lib/orchestrator/agents/skill-tools", () => ({
  createSkillTools,
}));

vi.mock("@/lib/llm/stream-chat", () => ({
  chatComplete,
}));

import { streamParticipantTurn } from "@/lib/orchestrator/agents/participant-agent";

async function drain(gen: AsyncGenerator<unknown, unknown>) {
  const events: unknown[] = [];
  let next = await gen.next();
  while (!next.done) {
    events.push(next.value);
    next = await gen.next();
  }
  return events;
}

describe("participant-agent safety", () => {
  const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "https://x", provider: "openai" as const };
  const skill = {
    skillId: "sk1",
    name: "甲",
    description: "",
    contentHash: "h",
    dirPath: "skills/paul-graham-perspective",
    entryPath: "skills/paul-graham-perspective/SKILL.md",
    category: "哲学思想",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops quietly on abort", async () => {
    createReactAgent.mockReturnValue({
      stream: vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })),
    });

    const controller = new AbortController();
    controller.abort();
    await expect(
      drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲", "无新增插话", controller.signal))
    ).resolves.toEqual([]);
  });

  it("repairs participant output when it starts speaking as主持 or another seat", async () => {
    const { AIMessageChunk } = await import("@langchain/core/messages");
    const stream = vi.fn().mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield [new AIMessageChunk("【主持】先替大家总结。")];
      },
    });
    chatComplete.mockResolvedValueOnce("我只说我这一席的判断。\n\n**简言之**：回到本席。");
    createReactAgent.mockReturnValue({ stream });

    const events = await drain(streamParticipantTurn(runtime, "gpt", skill, "记录", "甲", "无新增插话", ["甲", "乙"]));

    expect(chatComplete).toHaveBeenCalled();
    expect(events[events.length - 1]).toEqual({
      type: "turn_complete",
      role: "speaker",
      skillId: "sk1",
      fullText: "我只说我这一席的判断。\n\n**简言之**：回到本席。",
    });
  });
});
