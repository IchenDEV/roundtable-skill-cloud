import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.hoisted(() => vi.fn(() => ({ tag: "browser" as const })));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient,
}));

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const urlKey = "NEXT_PUBLIC_SUPABASE_URL";
const anonKey = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("createSupabaseBrowserClient", () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...snapshot };
  });

  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("returns null without env", () => {
    delete process.env[urlKey];
    delete process.env[anonKey];
    expect(createSupabaseBrowserClient()).toBeNull();
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("returns client when env set", () => {
    process.env[urlKey] = "https://x.supabase.co";
    process.env[anonKey] = "anon";
    expect(createSupabaseBrowserClient()).toEqual({ tag: "browser" });
    expect(createBrowserClient).toHaveBeenCalled();
  });
});
