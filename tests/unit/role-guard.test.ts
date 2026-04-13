import { describe, expect, it } from "vitest";
import { hasModeratorBoundaryViolation, hasParticipantBoundaryViolation } from "@/lib/orchestrator/agents/role-guard";

describe("role-guard", () => {
  it("flags moderator text that impersonates participants with labels", () => {
    expect(hasModeratorBoundaryViolation("【苏格拉底】我先回答。", ["苏格拉底", "韩非"])).toBe(true);
    expect(hasModeratorBoundaryViolation("韩非：这就是我的立场。", ["苏格拉底", "韩非"])).toBe(true);
  });

  it("allows normal moderator guidance without fabricated speaker labels", () => {
    expect(hasModeratorBoundaryViolation("我只提一个问题：你们各自最强的证据是什么？", ["苏格拉底", "韩非"])).toBe(
      false
    );
  });

  it("flags participant text that starts speaking as主持", () => {
    expect(hasParticipantBoundaryViolation("主持：请继续。", "苏格拉底", ["苏格拉底", "韩非"])).toBe(true);
    expect(hasParticipantBoundaryViolation("【韩非】我替他答。", "苏格拉底", ["苏格拉底", "韩非"])).toBe(true);
  });
});
