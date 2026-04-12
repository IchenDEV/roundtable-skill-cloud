import { describe, expect, it } from "vitest";
import { buildRoundtableHref, filterAvailableSkillIds, HOME_QUICKSTART_EXAMPLES } from "@/lib/home/home-quick-start";

describe("home quick start", () => {
  it("builds roundtable links with trimmed topic, deduped skills, and max rounds", () => {
    expect(
      buildRoundtableHref({
        topic: "  人工智能是否会削弱人的主体性？ ",
        skillIds: ["andrej-karpathy-perspective", "feynman-perspective", "andrej-karpathy-perspective", ""],
        maxRounds: 3.8,
      })
    ).toBe(
      "/roundtable?topic=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E6%98%AF%E5%90%A6%E4%BC%9A%E5%89%8A%E5%BC%B1%E4%BA%BA%E7%9A%84%E4%B8%BB%E4%BD%93%E6%80%A7%EF%BC%9F&skills=andrej-karpathy-perspective%2Cfeynman-perspective&maxRounds=3"
    );
  });

  it("filters quick start skills against the manifest set while keeping order", () => {
    expect(filterAvailableSkillIds(["b", "c", "a"], ["x", "c", "a"])).toEqual(["c", "a"]);
  });

  it("ships curated examples with at least one preselected participant", () => {
    expect(HOME_QUICKSTART_EXAMPLES.every((example) => example.skillIds.length > 0)).toBe(true);
  });
});
