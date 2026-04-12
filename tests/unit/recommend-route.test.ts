import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveLlm = vi.hoisted(() =>
  vi.fn(async () => ({
    runtime: {
      kind: "openai_compat" as const,
      apiKey: "k",
      baseURL: "https://example.com/v1",
      provider: "openai" as const,
    },
    model: "gpt-test",
  }))
);
const chatToolCall = vi.hoisted(() => vi.fn());
const chatComplete = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/resolve-llm", () => ({
  resolveLlm,
}));

vi.mock("@/lib/llm/stream-chat", () => ({
  chatToolCall,
  chatComplete,
}));

import { POST } from "@/app/api/roundtable/recommend/route";

function makeRequest() {
  return new Request("https://example.com/api/roundtable/recommend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      topic: "AI 时代如何学编程",
      availableSkillIds: [
        "paul-graham-perspective",
        "andrej-karpathy-perspective",
        "feynman-perspective",
        "custom-skill",
      ],
    }),
  });
}

describe("POST /api/roundtable/recommend", () => {
  beforeEach(() => {
    resolveLlm.mockClear();
    chatToolCall.mockReset();
    chatComplete.mockReset();
  });

  it("prefers tool-call payloads and filters invalid ids", async () => {
    chatToolCall.mockResolvedValue({
      input: {
        recommendedSkillIds: [
          "paul-graham-perspective",
          "missing-skill",
          "feynman-perspective",
          "paul-graham-perspective",
        ],
      },
      text: "",
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      recommendedSkillIds: ["paul-graham-perspective", "feynman-perspective"],
    });
    expect(chatComplete).not.toHaveBeenCalled();
  });

  it("accepts tool-call text that wraps structured json", async () => {
    chatToolCall.mockResolvedValue({
      input: null,
      text: '```json\n{"recommendedSkillIds":["andrej-karpathy-perspective","feynman-perspective"]}\n```',
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      recommendedSkillIds: ["andrej-karpathy-perspective", "feynman-perspective"],
    });
    expect(chatComplete).not.toHaveBeenCalled();
  });

  it("falls back to plain completion when tool calls are unavailable", async () => {
    chatToolCall.mockRejectedValue(new Error("tooling unsupported"));
    chatComplete.mockResolvedValueOnce('["feynman-perspective","custom-skill"]');

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      recommendedSkillIds: ["feynman-perspective", "custom-skill"],
    });
  });

  it("returns a format error when neither tool nor fallback is structured", async () => {
    chatToolCall.mockResolvedValue({ input: null, text: "随便聊聊，不给结构。" });
    chatComplete.mockResolvedValueOnce("还是一段散文。");

    const res = await POST(makeRequest());

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "推荐引擎返回格式异常，请重试。" });
  });
});
