import { describe, expect, it, vi } from "vitest";
import type { SharePayload } from "@/lib/spec/share-payload";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRole: vi.fn(),
}));

import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { fetchSharePayloadByToken, insertShareSnapshot } from "@/lib/db/share-snapshot";

const minimalState: SharePayload["state"] = {
  mode: "discussion",
  topic: "t",
  round: 0,
  maxRounds: 2,
  phase: "done",
  participantSkillIds: [],
  transcript: [],
  moderatorMemory: "",
};

describe("share-snapshot", () => {
  it("fetchSharePayloadByToken rejects non-hex token", async () => {
    expect(await fetchSharePayloadByToken("not-valid-token-string-at-all")).toBeNull();
  });

  it("insertShareSnapshot returns null without service client", async () => {
    vi.mocked(createSupabaseServiceRole).mockReturnValue(null);
    const payload: SharePayload = { v: 1, state: minimalState, skillNames: {} };
    expect(await insertShareSnapshot(payload, null)).toBeNull();
  });

  it("insertShareSnapshot returns token on success", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createSupabaseServiceRole).mockReturnValue({
      from: () => ({ insert }),
    } as never);
    const payload: SharePayload = { v: 1, state: minimalState, skillNames: {} };
    const token = await insertShareSnapshot(payload, "00000000-0000-4000-8000-000000000001");
    expect(token).toMatch(/^[a-f0-9]{32}$/);
    expect(insert).toHaveBeenCalled();
  });

  it("insertShareSnapshot returns null on insert error", async () => {
    vi.mocked(createSupabaseServiceRole).mockReturnValue({
      from: () => ({
        insert: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
      }),
    } as never);
    const payload: SharePayload = { v: 1, state: minimalState, skillNames: {} };
    expect(await insertShareSnapshot(payload, null)).toBeNull();
  });

  it("fetchSharePayloadByToken returns null on db error", async () => {
    const token = "c".repeat(32);
    vi.mocked(createSupabaseServiceRole).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: "e" } }),
          }),
        }),
      }),
    } as never);
    expect(await fetchSharePayloadByToken(token)).toBeNull();
  });

  it("fetchSharePayloadByToken returns null when payload invalid", async () => {
    const token = "b".repeat(32);
    vi.mocked(createSupabaseServiceRole).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { payload: { v: 999, state: {}, skillNames: {} } },
                error: null,
              }),
          }),
        }),
      }),
    } as never);
    expect(await fetchSharePayloadByToken(token)).toBeNull();
  });

  it("fetchSharePayloadByToken parses row", async () => {
    const token = "a".repeat(32);
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        payload: { v: 1, state: minimalState, skillNames: { x: "X" } },
      },
      error: null,
    });
    vi.mocked(createSupabaseServiceRole).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      }),
    } as never);
    const got = await fetchSharePayloadByToken(token);
    expect(got?.skillNames.x).toBe("X");
  });
});
