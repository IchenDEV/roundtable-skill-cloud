import { describe, expect, it } from "vitest";
import { formatTranscript, formatTranscriptForSeat } from "@/lib/orchestrator/format-context";
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

    const named = formatTranscript(entries, { sk: "Paul Graham" });
    expect(named).toContain("【Paul Graham】");
    expect(named).not.toContain("【sk】");
  });

  it("truncates with head ellipsis when over maxChars", () => {
    const long = "x".repeat(100);
    const entries: TranscriptEntry[] = [{ role: "moderator", content: long, ts: "1" }];
    const t = formatTranscript(entries, undefined, 40);
    expect(t).toContain("…（前略）…");
    expect(t.length).toBeLessThanOrEqual(long.length + 50);
  });
});

describe("formatTranscriptForSeat", () => {
  const entries: TranscriptEntry[] = [
    { role: "moderator", content: "开场", ts: "1" },
    { role: "speaker", skillId: "trump", content: "我的观点", ts: "2" },
    { role: "speaker", skillId: "zhang", content: "反驳", ts: "3" },
    { role: "user", content: "用户插话", ts: "4" },
  ];
  const names = { trump: "特朗普", zhang: "张雪峰" };

  it("returns placeholder when empty", () => {
    expect(formatTranscriptForSeat([], "trump")).toBe("（尚无发言）");
  });

  it("marks own entries with ★ and annotation", () => {
    const t = formatTranscriptForSeat(entries, "trump", names);
    expect(t).toContain("★【特朗普】（你的前次发言）");
    expect(t).not.toContain("★【张雪峰】");
    expect(t).toContain("【张雪峰】");
    expect(t).toContain("【主持】");
    expect(t).toContain("【席上你我】");
  });

  it("does not mark other speakers' entries", () => {
    const t = formatTranscriptForSeat(entries, "zhang", names);
    expect(t).toContain("★【张雪峰】（你的前次发言）");
    expect(t).not.toContain("★【特朗普】");
  });

  it("truncates long transcript", () => {
    const long: TranscriptEntry[] = [{ role: "moderator", content: "x".repeat(200), ts: "1" }];
    const t = formatTranscriptForSeat(long, "trump", names, 50);
    expect(t).toContain("…（前略）…");
  });
});
