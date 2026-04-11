import { describe, expect, it, vi } from "vitest";

const anthropicCtor = vi.hoisted(() => vi.fn());
const openAiCtor = vi.hoisted(() => vi.fn());

vi.mock("@langchain/anthropic", () => ({
  ChatAnthropic: class ChatAnthropic {
    constructor(opts: unknown) {
      anthropicCtor(opts);
    }
  },
}));

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: class ChatOpenAI {
    constructor(opts: unknown) {
      openAiCtor(opts);
    }
  },
}));

import { toLangChainModel } from "@/lib/llm/to-langchain-model";

describe("toLangChainModel", () => {
  it("creates anthropic chat model", () => {
    const runtime = { kind: "anthropic" as const, apiKey: "k", provider: "anthropic" as const };
    const model = toLangChainModel(runtime, "claude");
    expect(model).toBeInstanceOf(Object);
    expect(anthropicCtor).toHaveBeenCalledWith({ apiKey: "k", model: "claude", temperature: 0, maxTokens: 8192 });
  });

  it("creates openai-compatible chat model", () => {
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "https://x", provider: "openai" as const };
    const model = toLangChainModel(runtime, "gpt");
    expect(model).toBeInstanceOf(Object);
    expect(openAiCtor).toHaveBeenCalledWith({
      apiKey: "k",
      model: "gpt",
      temperature: 0,
      maxTokens: 8192,
      configuration: { baseURL: "https://x" },
    });
  });
});
