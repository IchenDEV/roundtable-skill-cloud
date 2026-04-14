import { describe, expect, it } from "vitest";
import { buildUserInterjectionNote, hasPendingUserInterjection } from "@/lib/orchestrator/user-interjection-context";
import type { TranscriptEntry } from "@/lib/spec/schema";

describe("user-interjection-context", () => {
  it("does not invent a fresh user interjection when the user stayed silent", () => {
    const entries: TranscriptEntry[] = [
      { role: "moderator", content: "上一轮收束", ts: "2026-04-14T10:00:00.000Z" },
      { role: "moderator", content: "新一轮开场", ts: "2026-04-14T10:01:00.000Z" },
    ];

    expect(hasPendingUserInterjection(entries, "participant")).toBe(false);
    expect(buildUserInterjectionNote(entries, "participant")).toContain("本轮新增席上插话：无");
  });

  it("surfaces the latest user interjection for the current round", () => {
    const entries: TranscriptEntry[] = [
      { role: "moderator", content: "上一轮收束", ts: "2026-04-14T10:00:00.000Z" },
      { role: "user", content: "我怀疑这个前提本身就偏了。", ts: "2026-04-14T10:00:30.000Z" },
      { role: "moderator", content: "新一轮开场", ts: "2026-04-14T10:01:00.000Z" },
    ];

    expect(hasPendingUserInterjection(entries, "participant")).toBe(true);
    expect(buildUserInterjectionNote(entries, "participant")).toContain("我怀疑这个前提本身就偏了。");
  });
});
