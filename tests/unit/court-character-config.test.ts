import { describe, expect, it } from "vitest";
import { buildCourtPortraitMeta } from "@/components/court/court-character-config";

describe("buildCourtPortraitMeta", () => {
  it("assigns distinct ribbon and emblem semantics per role", () => {
    expect(buildCourtPortraitMeta("judge", "审判长")).toMatchObject({
      ribbon: "秉衡",
      emblem: "衡",
      tone: "gold",
    });
    expect(buildCourtPortraitMeta("speaker", "王阳明")).toMatchObject({
      ribbon: "主辩",
      emblem: "辞",
      tone: "crimson",
    });
    expect(buildCourtPortraitMeta("attendee", "韩非")).toMatchObject({
      ribbon: "旁听",
      emblem: "听",
      tone: "jade",
    });
  });
});
