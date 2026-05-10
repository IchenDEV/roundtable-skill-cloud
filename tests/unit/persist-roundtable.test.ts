import { describe, expect, it, vi } from "vitest";

import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import type { RoundtableState } from "@/lib/spec/schema";

describe("persistRoundtableState", () => {
  const ctx = (rpc: ReturnType<typeof vi.fn>) =>
    ({
      userId: "u1",
      supabase: { rpc },
    }) as never;

  it("no-ops without sessionId", async () => {
    const rpc = vi.fn();
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
    await persistRoundtableState(state, ctx(rpc));
    expect(rpc).not.toHaveBeenCalled();
  });

  it("throws when rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "rpc fail" } });
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
    await expect(persistRoundtableState(state, ctx(rpc))).rejects.toThrow(/写入/);
    expect(rpc).toHaveBeenCalled();
  });

  it("persists mode, checkpoint, and transcript via rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
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
      ...({
        runCheckpoint: {
          kind: "round",
          nextStep: "participant",
          steps: [{ skillId: "sk1" }],
          stepIndex: 0,
          updatedAt: "2026-05-04T00:00:00.000Z",
        },
      } as Partial<RoundtableState>),
    };
    await persistRoundtableState(state, ctx(rpc));
    expect(rpc).toHaveBeenCalledWith(
      "persist_roundtable_state",
      expect.objectContaining({
        p_session_id: state.sessionId,
        p_mode: "debate",
        p_participant_skill_ids: ["sk1"],
        p_run_checkpoint: state.runCheckpoint,
        p_messages: [{ role: "moderator", skill_id: null, content: "c", content_hash: null, position_idx: 0 }],
      })
    );
  });
});
