import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(() => "# 主持桩\n"),
  },
}));

import fs from "node:fs";
import { loadModeratorPrompt } from "@/lib/orchestrator/moderator-load";

describe("loadModeratorPrompt", () => {
  it("reads moderator content via fs", () => {
    expect(loadModeratorPrompt()).toContain("主持桩");
    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalled();
  });
});
