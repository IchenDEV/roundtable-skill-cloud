import { describe, expect, it } from "vitest";
import { beginStreamSlot, endStreamSlot, takeStreamRateToken } from "@/lib/server/rate-limit-stream";

describe("rate-limit-stream", () => {
  it("enforces concurrent slots per key", () => {
    const key = "concurrent:test";
    expect(beginStreamSlot(key)).toBe(true);
    expect(beginStreamSlot(key)).toBe(true);
    expect(beginStreamSlot(key)).toBe(false);
    endStreamSlot(key);
    expect(beginStreamSlot(key)).toBe(true);
    endStreamSlot(key);
    endStreamSlot(key);
  });

  it("enforces start-rate window", () => {
    const key = `rate:${Date.now()}`;
    for (let i = 0; i < 24; i += 1) {
      expect(takeStreamRateToken(key)).toBe(true);
    }
    expect(takeStreamRateToken(key)).toBe(false);
  });
});
