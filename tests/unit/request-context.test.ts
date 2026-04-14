import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  asServerUserContext,
  buildServerRequestContext,
  normalizeUpstreamLlmError,
  requireAuthenticatedUser,
} from "@/lib/server/request-context";

describe("request-context", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    vi.resetAllMocks();
  });

  it("builds a dev bypass context when enabled", async () => {
    process.env = { ...process.env, NODE_ENV: "development", DEV_LLM_API_KEY: "dev-key" };

    const ctx = await buildServerRequestContext(new Request("https://example.com"), { allowDevBypass: true });
    expect(ctx.devBypass).toBe(true);
    expect(ctx.guardKey).toMatch(/^dev:/);
  });

  it("reads user identity once from supabase", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const ctx = await buildServerRequestContext();
    expect(ctx.devBypass).toBe(false);
    expect(ctx.userId).toBe("u1");
    expect(ctx.guardKey).toBe("u:u1");
  });

  it("returns a 401 error when auth is required but user is missing", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const ctx = await buildServerRequestContext();
    const res = requireAuthenticatedUser(ctx, {
      noStoreMessage: "no store",
      unauthenticatedMessage: "need login",
    });

    expect(res?.status).toBe(401);
    await expect(res?.json()).resolves.toEqual({ error: "need login" });
  });

  it("projects an authenticated server user context", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const ctx = await buildServerRequestContext();
    expect(asServerUserContext(ctx)).toMatchObject({ userId: "u1" });
  });

  it("normalizes upstream quota and network errors", () => {
    expect(normalizeUpstreamLlmError(new Error("insufficient_quota"))).toMatch(/额度不足/);
    expect(normalizeUpstreamLlmError(new Error("fetch failed"))).toMatch(/网络异常/);
  });
});
