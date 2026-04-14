import { describe, expect, it } from "vitest";
import { buildCourtStageScene } from "@/components/court/court-stage-scene";
import type { TranscriptEntry } from "@/lib/spec/schema";

describe("buildCourtStageScene", () => {
  const skillTitle = (id: string) => ({ a: "甲", b: "乙", c: "丙" })[id] ?? id;

  it("uses active speaker as foreground and target as the first side portrait", () => {
    const transcript: TranscriptEntry[] = [{ role: "speaker", skillId: "a", content: "先前陈词", ts: "1" }];

    const scene = buildCourtStageScene({
      transcript,
      participantIds: ["a", "b", "c"],
      liveTokens: { role: "speaker", skillId: "b", text: "正在发言" },
      activeRole: "speaker",
      activeSkillId: "b",
      targetSkillId: "c",
      skillTitle,
    });

    expect(scene.foregroundSkillId).toBe("b");
    expect(scene.sidePortraitIds).toEqual(["c", "a"]);
    expect(scene.latest.label).toBe("乙");
    expect(scene.roleState.speaker).toBe(true);
  });

  it("returns placeholder copy when streaming speaker has not emitted visible text yet", () => {
    const scene = buildCourtStageScene({
      transcript: [],
      participantIds: ["a"],
      liveTokens: { role: "speaker", skillId: "a", text: "" },
      activeRole: "speaker",
      activeSkillId: "a",
      skillTitle,
    });

    expect(scene.latest.placeholder).toBe(true);
    expect(scene.latest.content).toContain("执笔正在整卷与落字");
  });

  it("falls back to the most recent transcript speaker when no active speaker is present", () => {
    const transcript: TranscriptEntry[] = [
      { role: "moderator", content: "开场", ts: "1" },
      { role: "speaker", skillId: "c", content: "旧席发言", ts: "2" },
    ];

    const scene = buildCourtStageScene({
      transcript,
      participantIds: ["a", "b", "c"],
      liveTokens: null,
      activeRole: "moderator",
      skillTitle,
    });

    expect(scene.foregroundSkillId).toBe("c");
    expect(scene.foregroundLabel).toBe("丙");
    expect(scene.roleState.moderator).toBe(true);
    expect(scene.latest.content).toBe("旧席发言");
  });

  it("does not mark speaker state active when only moderator live tokens are streaming", () => {
    const scene = buildCourtStageScene({
      transcript: [],
      participantIds: ["a", "b"],
      liveTokens: { role: "moderator", text: "主持开场" },
      activeRole: "moderator",
      skillTitle,
    });

    expect(scene.roleState.moderator).toBe(true);
    expect(scene.roleState.speaker).toBe(false);
    expect(scene.latest.label).toBe("审判长");
  });
});
