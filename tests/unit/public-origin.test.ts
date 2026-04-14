import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { resolvePublicOrigin } from "@/lib/server/public-origin";

describe("resolvePublicOrigin", () => {
  const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
  const prevVercel = process.env.VERCEL_URL;
  const prevNode = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    process.env = { ...process.env, NODE_ENV: "test" };
    vi.mocked(headers).mockReset();
  });

  afterEach(() => {
    process.env = {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: prevSite,
      VERCEL_URL: prevVercel,
      NODE_ENV: prevNode,
    };
  });

  it("prefers NEXT_PUBLIC_SITE_URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://fixed.example/";
    expect(await resolvePublicOrigin()).toBe("https://fixed.example");
  });

  it("builds from forwarded headers when host matches VERCEL_URL", async () => {
    process.env.VERCEL_URL = "app.example";
    const h = new Headers();
    h.set("x-forwarded-host", "app.example");
    h.set("x-forwarded-proto", "https");
    vi.mocked(headers).mockResolvedValue(h as never);
    expect(await resolvePublicOrigin()).toBe("https://app.example");
  });

  it("rejects host not in allowlist (production)", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    const h = new Headers();
    h.set("x-forwarded-host", "evil.example");
    h.set("x-forwarded-proto", "https");
    vi.mocked(headers).mockResolvedValue(h as never);
    expect(await resolvePublicOrigin()).toBeNull();
  });

  it("allows localhost in development", async () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    const h = new Headers();
    h.set("host", "localhost:3000");
    vi.mocked(headers).mockResolvedValue(h as never);
    expect(await resolvePublicOrigin()).toBe("http://localhost:3000");
  });

  it("returns null without host", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
    expect(await resolvePublicOrigin()).toBeNull();
  });
});
