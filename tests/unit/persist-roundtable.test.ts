import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import type { RoundtableState } from "@/lib/spec/schema";

describe("persistRoundtableState", () => {
  it("no-ops without sessionId", async () => {
    vi.mocked(createSupabaseServerClient).mockClear();
    const state: RoundtableState = {
      mode: "discussion",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: [],
      transcript: [],
      moderatorMemory: "",
    };
    await persistRoundtableState(state);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("no-ops when supabase null", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    const state: RoundtableState = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      mode: "discussion",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: [],
      transcript: [{ role: "moderator", content: "c", ts: "1" }],
      moderatorMemory: "",
    };
    await persistRoundtableState(state);
    expect(createSupabaseServerClient).toHaveBeenCalled();
  });

  it("throws when rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "rpc fail" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      rpc,
    } as never);
    const state: RoundtableState = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      mode: "discussion",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: [],
      transcript: [{ role: "moderator", content: "c", ts: "1" }],
      moderatorMemory: "",
    };
    await expect(persistRoundtableState(state)).rejects.toThrow(/落库/);
    expect(rpc).toHaveBeenCalled();
  });

  it("persists mode and transcript via rpc when user present", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      rpc,
    } as never);

    const state: RoundtableState = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      mode: "debate",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: ["sk1"],
      transcript: [{ role: "moderator", content: "c", ts: "1" }],
      moderatorMemory: "",
    };
    await persistRoundtableState(state);
    expect(rpc).toHaveBeenCalledWith(
      "persist_roundtable_state",
      expect.objectContaining({
        p_session_id: state.sessionId,
        p_mode: "debate",
        p_participant_skill_ids: ["sk1"],
        p_messages: [{ role: "moderator", skill_id: null, content: "c", content_hash: null, position_idx: 0 }],
      })
    );
  });
});
