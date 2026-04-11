import { describe, expect, it } from "vitest";
import { clientIpFromRequest } from "@/lib/server/client-ip";

describe("clientIpFromRequest", () => {
  it("prefers first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" },
    });
    expect(clientIpFromRequest(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip then unknown", () => {
    const real = new Request("https://example.com", { headers: { "x-real-ip": "4.4.4.4" } });
    expect(clientIpFromRequest(real)).toBe("4.4.4.4");
    expect(clientIpFromRequest(new Request("https://example.com"))).toBe("unknown");
  });
});
