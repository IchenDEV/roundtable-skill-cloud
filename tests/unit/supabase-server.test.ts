import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createServerClient = vi.hoisted(() => vi.fn(() => ({ tag: "server" as const })));
const createClient = vi.hoisted(() => vi.fn(() => ({ tag: "service" as const })));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

import { createSupabaseServerClient, createSupabaseServiceRole } from "@/lib/supabase/server";

const urlKey = "NEXT_PUBLIC_SUPABASE_URL";
const anonKey = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("supabase server helpers", () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...snapshot };
  });

  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("createSupabaseServerClient returns null without URL", async () => {
    delete process.env[urlKey];
    delete process.env[anonKey];
    expect(await createSupabaseServerClient()).toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("createSupabaseServerClient returns client when env set", async () => {
    process.env[urlKey] = "https://x.supabase.co";
    process.env[anonKey] = "anon";
    const c = await createSupabaseServerClient();
    expect(c).toEqual({ tag: "server" });
    expect(createServerClient).toHaveBeenCalled();
  });

  it("createSupabaseServiceRole null without service key", () => {
    process.env[urlKey] = "https://x.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(createSupabaseServiceRole()).toBeNull();
  });

  it("createSupabaseServiceRole returns client with role key", () => {
    process.env[urlKey] = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "role";
    expect(createSupabaseServiceRole()).toEqual({ tag: "service" });
  });
});
