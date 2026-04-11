import { describe, expect, it, vi } from "vitest";

const manifestJson = JSON.stringify({
  generatedAt: "g",
  skills: [
    {
      skillId: "s1",
      name: "N",
      description: "",
      contentHash: "h",
      compiledPrompt: "p",
      rawPath: "/x",
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
  });
});
