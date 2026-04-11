import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deleteRoundtableSession,
  getRoundtableSessionState,
  listRoundtableSessions,
} from "@/lib/db/roundtable-sessions";

function mockClient(over: {
  user?: { id: string } | null;
  listData?: unknown;
  listError?: { message: string } | null;
  listResult?: { data: unknown; error: unknown };
  sessionRow?: unknown;
  sessionErr?: unknown;
  msgs?: unknown;
  msgsErr?: unknown;
  delErr?: unknown;
}) {
  const resolvedUser = over.user === undefined ? { id: "u1" } : over.user;
  const getUser = vi.fn().mockResolvedValue({ data: { user: resolvedUser } });
  const from = vi.fn((table: string) => {
    if (table === "roundtable_sessions" && over.listResult) {
      return {
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve(over.listResult),
          }),
        }),
      };
    }
    if (table === "roundtable_sessions" && over.listData !== undefined) {
      return {
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: over.listData, error: over.listError ?? null }),
          }),
        }),
      };
    }
    if (table === "roundtable_sessions" && over.sessionRow !== undefined) {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: over.sessionRow, error: over.sessionErr ?? null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: over.delErr ?? null }),
          }),
        }),
      };
    }
    if (table === "roundtable_messages") {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: over.msgs ?? [], error: over.msgsErr ?? null }),
          }),
        }),
      };
    }
    return {};
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser },
    from,
  } as never);
}

describe("roundtable-sessions", () => {
  it("listRoundtableSessions no_db", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    const r = await listRoundtableSessions();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("no_db");
  });

  it("listRoundtableSessions unauthorized", async () => {
    mockClient({ user: null });
    const r = await listRoundtableSessions();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unauthorized");
  });

  it("listRoundtableSessions query_failed", async () => {
    mockClient({
      listResult: { data: null, error: { message: "db" } },
    });
    const r = await listRoundtableSessions();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("query_failed");
  });

  it("listRoundtableSessions maps rows", async () => {
    mockClient({
      listData: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          topic: "T",
          phase: "done",
          current_round: 1,
          max_rounds: 3,
          updated_at: "2020-01-01",
          created_at: "2020-01-01",
        },
      ],
    });
    const r = await listRoundtableSessions();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sessions[0].topic).toBe("T");
  });

  it("getRoundtableSessionState maps transcript and phase", async () => {
    mockClient({
      sessionRow: {
        id: "00000000-0000-4000-8000-000000000001",
        topic: "T",
        mode: "debate",
        participant_skill_ids: ["a"],
        max_rounds: 2,
        current_round: 1,
        phase: "bad-phase",
        moderator_memory: "m",
        synthesis: null,
      },
      msgs: [
        {
          role: "moderator",
          skill_id: null,
          content: "c",
          content_hash: null,
          created_at: "t",
        },
        {
          role: "weird",
          skill_id: null,
          content: "x",
          content_hash: null,
          created_at: "t2",
        },
      ],
    });
    const s = await getRoundtableSessionState("00000000-0000-4000-8000-000000000001");
    expect(s?.phase).toBe("done");
    expect(s?.mode).toBe("debate");
    expect(s?.transcript[1].role).toBe("system");
  });

  it("deleteRoundtableSession", async () => {
    mockClient({
      sessionRow: {},
      delErr: null,
    });
    await expect(deleteRoundtableSession("00000000-0000-4000-8000-000000000001")).resolves.toBe(true);
  });
});
