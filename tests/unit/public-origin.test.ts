import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { resolvePublicOrigin } from "@/lib/server/public-origin";

describe("resolvePublicOrigin", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.mocked(headers).mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("prefers NEXT_PUBLIC_SITE_URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://fixed.example/";
    expect(await resolvePublicOrigin()).toBe("https://fixed.example");
  });

  it("builds from forwarded headers", async () => {
    const h = new Headers();
    h.set("x-forwarded-host", "app.example");
    h.set("x-forwarded-proto", "https");
    vi.mocked(headers).mockResolvedValue(h as never);
    expect(await resolvePublicOrigin()).toBe("https://app.example");
  });

  it("returns null without host", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
    expect(await resolvePublicOrigin()).toBeNull();
  });
});
