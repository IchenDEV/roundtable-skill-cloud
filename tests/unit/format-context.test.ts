import { describe, expect, it } from "vitest";
import { formatTranscript } from "@/lib/orchestrator/format-context";
import type { TranscriptEntry } from "@/lib/spec/schema";

describe("formatTranscript", () => {
  it("returns placeholder when empty", () => {
    expect(formatTranscript([])).toBe("（尚无发言）");
  });

  it("labels roles and joins", () => {
    const entries: TranscriptEntry[] = [
      { role: "moderator", content: "m", ts: "1" },
      { role: "speaker", skillId: "sk", content: "s", ts: "2" },
      { role: "user", content: "u", ts: "3" },
      { role: "system", content: "sys", ts: "4" },
    ];
    const t = formatTranscript(entries);
    expect(t).toContain("【主持】");
    expect(t).toContain("【sk】");
    expect(t).toContain("【席上你我】");
    expect(t).toContain("【系统】");
  });

  it("truncates with head ellipsis when over maxChars", () => {
    const long = "x".repeat(100);
    const entries: TranscriptEntry[] = [{ role: "moderator", content: long, ts: "1" }];
    const t = formatTranscript(entries, 40);
    expect(t).toContain("…（前略）…");
    expect(t.length).toBeLessThanOrEqual(long.length + 50);
  });
});
