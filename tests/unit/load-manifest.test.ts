import { describe, expect, it, vi } from "vitest";

const manifestJson = JSON.stringify({
  generatedAt: "g",
  skills: [
    {
      skillId: "s1",
      name: "N",
      description: "",
      displayName: "展示名",
      displayBrief: "一句话",
      contentHash: "h",
      dirPath: "skills/s1",
      entryPath: "skills/s1/SKILL.md",
      category: "其他",
    },
  ],
});

vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(() => manifestJson),
  },
}));

import { loadSkillManifest } from "@/lib/skills/load-manifest";

describe("loadSkillManifest", () => {
  it("parses manifest from .generated path", () => {
    const m = loadSkillManifest();
    expect(m.skills[0].skillId).toBe("s1");
    expect(m.skills[0].displayName).toBe("展示名");
  });
});
