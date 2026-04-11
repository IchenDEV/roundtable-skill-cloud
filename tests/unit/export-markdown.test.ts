import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRoundtableMarkdown, markdownFilename, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import type { RoundtableState } from "@/lib/spec/schema";

describe("buildRoundtableMarkdown", () => {
  it("builds headings and optional synthesis", () => {
    const state: Pick<RoundtableState, "topic" | "transcript" | "synthesis"> = {
      topic: "试议题",
      transcript: [
        { role: "moderator", content: "开场", ts: "t0" },
        { role: "speaker", skillId: "s1", content: "发言", ts: "t1" },
        { role: "user", content: "插话", ts: "t2" },
      ],
      synthesis: "提要",
    };
    const md = buildRoundtableMarkdown(state, (id) => (id === "s1" ? "费曼" : "列席"));
    expect(md).toContain("# 圆桌：试议题");
    expect(md).toContain("## 费曼");
    expect(md).toContain("## 席上（我）");
    expect(md).toContain("## 结案提要");
    expect(md).toContain("提要");
  });
});

describe("markdownFilename", () => {
  it("sanitizes topic", () => {
    expect(markdownFilename("a/b?c")).toMatch(/^圆桌-/);
    expect(markdownFilename("   ")).toBe("圆桌-圆桌.md");
  });
});

describe("triggerMarkdownDownload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates object URL and clicks anchor", () => {
    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => "blob:mock");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const anchor = { click, href: "", download: "" };
    const createElement = vi.fn(() => anchor);
    vi.stubGlobal("document", { createElement });

    triggerMarkdownDownload("议题", "# hi");

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
