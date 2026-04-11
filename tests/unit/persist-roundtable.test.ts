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

  it("stops when upsert errors", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "upsert fail" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => ({ upsert })),
    } as never);
    const state: RoundtableState = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: [],
      transcript: [{ role: "moderator", content: "c", ts: "1" }],
      moderatorMemory: "",
    };
    await persistRoundtableState(state);
    expect(upsert).toHaveBeenCalled();
  });

  it("upserts and inserts messages when user present", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn(() => ({
        upsert,
        delete: del,
        insert,
      })),
    } as never);

    const state: RoundtableState = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      topic: "t",
      round: 0,
      maxRounds: 1,
      phase: "done",
      participantSkillIds: [],
      transcript: [{ role: "moderator", content: "c", ts: "1" }],
      moderatorMemory: "",
    };
    await persistRoundtableState(state);
    expect(upsert).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
  });
});
