import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto/byok-crypto";

describe("byok-crypto", () => {
  const prev = process.env.KEY_ENCRYPTION_SECRET;

  beforeEach(() => {
    process.env.KEY_ENCRYPTION_SECRET = "x".repeat(32);
  });

  afterEach(() => {
    process.env.KEY_ENCRYPTION_SECRET = prev;
  });

  it("roundtrips plaintext", () => {
    const plain = "sk-test-key-123456";
    const enc = encryptSecret(plain);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("throws when secret missing", () => {
    delete process.env.KEY_ENCRYPTION_SECRET;
    expect(() => encryptSecret("a")).toThrow(/KEY_ENCRYPTION_SECRET/);
  });
});
