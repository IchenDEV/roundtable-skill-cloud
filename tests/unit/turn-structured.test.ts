import { describe, expect, it } from "vitest";
import { deriveRoundSection, deriveSpeakerStructured } from "@/lib/orchestrator/turn-structured";

describe("turn-structured", () => {
  it("detects structural differences across multi-seat outputs", () => {
    const seatA = deriveSpeakerStructured("我有实验与统计数据支撑。**简言之**：应优先做小规模试点。");
    const seatB = deriveSpeakerStructured("我反对这个前提，定义本身就偏了。或许先澄清概念。**简言之**：先纠偏再落地。");

    expect(seatA.stance).not.toEqual(seatB.stance);
    expect(seatA.evidenceTendency).not.toEqual(seatB.evidenceTendency);
    expect(seatA.confidence).not.toEqual(seatB.confidence);
  });

  it("extracts round sections and participating seats", () => {
    const wrap = `# 共识\n- 先做试点（席位：skill-a, skill-b）\n# 分歧\n- 是否立刻推广（席位：skill-a, skill-c）\n# 待证据补强\n- 长期成本数据不足（席位：skill-c）`;
    const section = deriveRoundSection(wrap, "分歧", ["skill-a", "skill-b", "skill-c"]);

    expect(section?.text).toContain("是否立刻推广");
    expect(section?.skillIds).toEqual(["skill-a", "skill-c"]);
  });
});
