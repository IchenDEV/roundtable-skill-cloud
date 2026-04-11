import { describe, expect, it } from "vitest";
import { getSkillDisplay } from "@/lib/skills/skill-display";

describe("getSkillDisplay", () => {
  it("returns curated label when known", () => {
    expect(getSkillDisplay("paul-graham-perspective")).toEqual({
      label: "保罗·格雷厄姆",
      brief: "YC 创始人，创业、写作与产品哲学",
    });
  });

  it("falls back to raw skill id when unknown", () => {
    expect(getSkillDisplay("custom-skill")).toEqual({ label: "custom-skill", brief: "" });
  });
});
