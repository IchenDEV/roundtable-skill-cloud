import { describe, expect, it } from "vitest";
import { getSkillDisplay } from "@/lib/skills/skill-display";

describe("getSkillDisplay", () => {
  it("returns manifest-derived display metadata when known", () => {
    expect(getSkillDisplay("paul-graham-perspective")).toEqual({
      label: "Paul Graham",
      brief: "用PG的视角分析创业、写作、产品和人生选择",
    });
  });

  it("falls back to raw skill id when unknown", () => {
    expect(getSkillDisplay("custom-skill")).toEqual({ label: "custom-skill", brief: "" });
  });
});
