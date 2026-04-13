import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchResumedSession, fetchSharedSession } from "@/lib/roundtable/session-loaders";
import type { RoundtableState } from "@/lib/spec/schema";

describe("session-loaders", () => {
  const fetchMock = vi.fn();
  const baseState: RoundtableState = {
    sessionId: "1f692e30-8f0c-4fdb-b7de-9a2f3789b113",
    mode: "discussion",
    topic: "题目",
    round: 1,
    maxRounds: 3,
    phase: "await_user",
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

  it("loads resumed sessions from the sessions api", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ state: baseState }), { status: 200 }));
    await expect(fetchResumedSession("abc")).resolves.toEqual({ ok: true, state: baseState, error: undefined });
    expect(fetchMock).toHaveBeenCalledWith("/api/roundtable/sessions/abc");
  });

  it("clones shared sessions from the share api", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ payload: { state: baseState } }), { status: 200 }));
    const result = await fetchSharedSession("share-token");
    expect(result.ok).toBe(true);
    expect(result.state?.topic).toBe("题目");
    expect(result.state?.sessionId).not.toBe(baseState.sessionId);
    expect(fetchMock).toHaveBeenCalledWith("/api/roundtable/share/share-token");
  });
});
