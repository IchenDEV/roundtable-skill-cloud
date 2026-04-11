import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/server/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows internal paths", () => {
    expect(safeRedirectPath("/roundtable", "/")).toBe("/roundtable");
    expect(safeRedirectPath("/settings?tab=1", "/")).toBe("/settings?tab=1");
  });

  it("rejects external and protocol tricks", () => {
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
    expect(safeRedirectPath("//evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/\\evil.com", "/")).toBe("/");
    expect(safeRedirectPath("?x=1", "/")).toBe("/");
  });

  it("uses fallback when null", () => {
    expect(safeRedirectPath(null, "/roundtable")).toBe("/roundtable");
  });
});
