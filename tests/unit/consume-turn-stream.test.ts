import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeTurnStream, persistRoundtableState } from "@/lib/orchestrator/client/consume-turn-stream";
import type { RoundtableState } from "@/lib/spec/schema";

function createSseResponse(blocks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const block of blocks) controller.enqueue(encoder.encode(block));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } }
  );
}

describe("consume-turn-stream", () => {
  const fetchMock = vi.fn();
  const state: RoundtableState = {
    sessionId: "1f692e30-8f0c-4fdb-b7de-9a2f3789b113",
    mode: "discussion",
    topic: "题目",
    round: 0,
    maxRounds: 3,
    phase: "running",
    participantSkillIds: ["skill-a"],
    transcript: [],
    moderatorMemory: "",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("dispatches streamed turn events to handlers", async () => {
    fetchMock.mockResolvedValue(
      createSseResponse([
        'data: {"type":"token","role":"moderator","text":"甲"}\n\n',
        'data: {"type":"dispatch","steps":[{"skillId":"skill-a","directive":"追问"}]}\n\n',
        'data: {"type":"memory","text":"手记"}\n\n',
        'data: {"type":"turn_complete","role":"moderator","fullText":"甲乙"}\n\n',
        'data: {"type":"done"}\n\n',
      ])
    );

    const handlers = {
      onToken: vi.fn(),
      onTurnComplete: vi.fn(),
      onDispatch: vi.fn(),
      onMemory: vi.fn(),
      onSynthesis: vi.fn(),
      onError: vi.fn(),
    };

    await consumeTurnStream(state, "moderator_open", {}, handlers, new AbortController().signal);

    expect(handlers.onToken).toHaveBeenCalledWith("moderator", "甲", undefined);
    expect(handlers.onDispatch).toHaveBeenCalledWith([{ skillId: "skill-a", directive: "追问" }]);
    expect(handlers.onMemory).toHaveBeenCalledWith("手记");
    expect(handlers.onTurnComplete).toHaveBeenCalledWith("moderator", "甲乙", undefined);
  });

  it("extracts server errors from non-ok responses", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "服务忙" }), { status: 503 }));
    await expect(
      consumeTurnStream(
        state,
        "participant",
        {},
        {
          onToken: vi.fn(),
          onTurnComplete: vi.fn(),
          onDispatch: vi.fn(),
          onMemory: vi.fn(),
          onSynthesis: vi.fn(),
          onError: vi.fn(),
        },
        new AbortController().signal
      )
    ).rejects.toThrow("服务忙");
  });

  it("persists state without surfacing network failures", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(persistRoundtableState(state)).resolves.toBeUndefined();
  });
});
