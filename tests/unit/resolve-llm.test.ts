import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/crypto/byok-crypto", () => ({
  decryptSecret: vi.fn(() => "plain-key"),
}));

describe("resolveLlm", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("uses DEV_LLM_API_KEY in development for openai_compat", async () => {
    process.env = { ...process.env, NODE_ENV: "development", DEV_LLM_API_KEY: "dev-key-12345678" };
    delete process.env.DEV_LLM_PROVIDER;
    const { resolveLlm } = await import("@/lib/server/resolve-llm");
    const r = await resolveLlm({ devBypass: true, supabase: null, userId: null });
    expect(r.runtime.kind).toBe("openai_compat");
    if (r.runtime.kind === "openai_compat") {
      expect(r.runtime.apiKey).toBe("dev-key-12345678");
    }
  });

  it("uses anthropic dev runtime when provider set", async () => {
    process.env = { ...process.env, NODE_ENV: "development", DEV_LLM_API_KEY: "dev-key-12345678" };
    process.env.DEV_LLM_PROVIDER = "anthropic";
    const { resolveLlm } = await import("@/lib/server/resolve-llm");
    const r = await resolveLlm({ devBypass: true, supabase: null, userId: null });
    expect(r.runtime.kind).toBe("anthropic");
  });

  it("throws when supabase missing in production path", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.DEV_LLM_API_KEY;
    const { resolveLlm } = await import("@/lib/server/resolve-llm");
    await expect(resolveLlm({ devBypass: false, supabase: null, userId: null })).rejects.toThrow(/账户库/);
  });

  it("resolves anthropic from supplied credentials context", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.DEV_LLM_API_KEY;
    process.env.KEY_ENCRYPTION_SECRET = "x".repeat(32);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "user_llm_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { active_provider: "anthropic", default_model: null },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "user_provider_credentials") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { ciphertext: "enc", api_base_url: null },
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { resolveLlm } = await import("@/lib/server/resolve-llm");
    const r = await resolveLlm({
      devBypass: false,
      userId: "u1",
      supabase: { from } as never,
    });
    expect(r.runtime.kind).toBe("anthropic");
  });

  it("resolves from supplied row for openai_compat", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.DEV_LLM_API_KEY;
    process.env.KEY_ENCRYPTION_SECRET = "x".repeat(32);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "user_llm_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { active_provider: "openai", default_model: null },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "user_provider_credentials") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { ciphertext: "enc", api_base_url: null },
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { resolveLlm } = await import("@/lib/server/resolve-llm");
    const r = await resolveLlm({
      devBypass: false,
      userId: "u1",
      supabase: { from } as never,
    });
    expect(r.runtime.kind).toBe("openai_compat");
  });
});
