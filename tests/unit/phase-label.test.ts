import { describe, expect, it } from "vitest";
import { phaseInWords } from "@/lib/roundtable/phase-label";

describe("phaseInWords", () => {
  it("maps known phases", () => {
    expect(phaseInWords("await_user")).toBe("候你一言");
    expect(phaseInWords("done")).toBe("已毕");
  });

  it("falls back for unknown", () => {
    expect(phaseInWords("custom")).toBe("进行中");
  });
});
