import { describe, expect, it, vi } from "vitest";

const openAiCreate = vi.fn();
const anthropicStream = vi.fn();
const anthropicCreate = vi.fn();

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: openAiCreate,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- SDK 构造桩
    constructor(_opts: unknown) {}
  },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    messages = {
      stream: anthropicStream,
      create: anthropicCreate,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- SDK 构造桩
    constructor(_opts: unknown) {}
  },
}));

import { chatComplete, streamChat } from "@/lib/llm/stream-chat";

describe("streamChat", () => {
  it("streams openai_compat deltas", async () => {
    openAiCreate.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "h" } }] };
        yield { choices: [{ delta: { content: "i" } }] };
      },
    });
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const chunks: string[] = [];
    const signal = new AbortController().signal;
    for await (const t of streamChat(runtime, "m", [{ role: "user", content: "u" }], signal)) {
      chunks.push(t);
    }
    expect(chunks.join("")).toBe("hi");
    expect(openAiCreate).toHaveBeenCalledWith(expect.objectContaining({ signal }));
  });

  it("streams anthropic text deltas", async () => {
    anthropicStream.mockResolvedValue({
      async *[Symbol.asyncIterator]() {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "a" } };
      },
    });
    const runtime = { kind: "anthropic" as const, apiKey: "k", provider: "anthropic" as const };
    const chunks: string[] = [];
    const signal = new AbortController().signal;
    for await (const t of streamChat(
      runtime,
      "m",
      [
        { role: "system", content: "sys" },
        { role: "user", content: "u" },
      ],
      signal
    )) {
      chunks.push(t);
    }
    expect(chunks.join("")).toBe("a");
    expect(anthropicStream).toHaveBeenCalledWith(expect.objectContaining({ signal }));
  });
});

describe("chatComplete", () => {
  it("returns openai message content", async () => {
    openAiCreate.mockResolvedValue({
      choices: [{ message: { content: "full" } }],
    });
    const runtime = { kind: "openai_compat" as const, apiKey: "k", baseURL: "http://x", provider: "openai" as const };
    const signal = new AbortController().signal;
    const text = await chatComplete(runtime, "m", [{ role: "user", content: "u" }], signal);
    expect(text).toBe("full");
    expect(openAiCreate).toHaveBeenCalledWith(expect.objectContaining({ signal }));
  });

  it("returns anthropic text block", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "ant" }],
    });
    const runtime = { kind: "anthropic" as const, apiKey: "k", provider: "anthropic" as const };
    const signal = new AbortController().signal;
    const text = await chatComplete(runtime, "m", [{ role: "user", content: "u" }], signal);
    expect(text).toBe("ant");
    expect(anthropicCreate).toHaveBeenCalledWith(expect.objectContaining({ signal }));
  });
});
