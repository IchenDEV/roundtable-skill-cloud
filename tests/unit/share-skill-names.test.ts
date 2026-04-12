import { describe, expect, it } from "vitest";
import { pickShareSkillNames } from "@/lib/roundtable/share-skill-names";

describe("pickShareSkillNames", () => {
  it("keeps only participant and transcript skill names", () => {
    const skillNames = {
      "sartre-perspective": "萨特",
      "turing-perspective": "图灵",
      "laozi-perspective": "老子",
      "unused-perspective": "未用人物",
    };

    const picked = pickShareSkillNames(
      {
        participantSkillIds: ["sartre-perspective", "turing-perspective"],
        transcript: [
          { role: "moderator", content: "开场", ts: "2026-04-13T00:00:00.000Z" },
          { role: "speaker", skillId: "laozi-perspective", content: "补充", ts: "2026-04-13T00:00:01.000Z" },
        ],
      },
      skillNames
    );

    expect(picked).toEqual({
      "sartre-perspective": "萨特",
      "turing-perspective": "图灵",
      "laozi-perspective": "老子",
    });
  });

  it("drops ids without a known name", () => {
    const picked = pickShareSkillNames(
      {
        participantSkillIds: ["known-perspective", "unknown-perspective"],
        transcript: [],
      },
      {
        "known-perspective": "已知人物",
      }
    );

    expect(picked).toEqual({
      "known-perspective": "已知人物",
    });
  });
});
