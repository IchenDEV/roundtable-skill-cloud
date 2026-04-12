import { describe, expect, it } from "vitest";
import { getSkillById } from "@/lib/skills/lookup";
import type { SkillManifest } from "@/lib/skills/types";

describe("getSkillById", () => {
  const manifest: SkillManifest = {
    generatedAt: "x",
    skills: [
      {
        skillId: "one",
        name: "One",
        description: "",
        contentHash: "h",
        dirPath: "skills/one",
        entryPath: "skills/one/SKILL.md",
        category: "其他",
      },
    ],
  };

  it("finds skill", () => {
    expect(getSkillById(manifest, "one")?.name).toBe("One");
  });

  it("returns undefined when missing", () => {
    expect(getSkillById(manifest, "two")).toBeUndefined();
  });
});
