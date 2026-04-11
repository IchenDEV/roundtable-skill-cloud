import { describe, expect, it } from "vitest";
import { BYOK_PROVIDERS, defaultApiBaseUrl, isOpenAiCompatibleProvider } from "@/lib/spec/constants";

describe("constants helpers", () => {
  it("defaultApiBaseUrl covers providers", () => {
    expect(defaultApiBaseUrl("openai")).toContain("openai");
    expect(defaultApiBaseUrl("openrouter")).toContain("openrouter");
    expect(defaultApiBaseUrl("anthropic")).toBe("");
    expect(defaultApiBaseUrl("doubao")).toContain("volces");
  });

  it("isOpenAiCompatibleProvider", () => {
    expect(isOpenAiCompatibleProvider("anthropic")).toBe(false);
    expect(isOpenAiCompatibleProvider("openai")).toBe(true);
  });

  it("BYOK_PROVIDERS is non-empty", () => {
    expect(BYOK_PROVIDERS.length).toBeGreaterThan(0);
  });

  it("defaultApiBaseUrl default branch", () => {
    // @ts-expect-error 刻意走 switch default
    expect(defaultApiBaseUrl("not-a-real-provider")).toBe("");
  });
});
