import { describe, expect, it } from "vitest";

describe("orchestrator index", () => {
  it("re-exports runSingleTurn", async () => {
    const mod = await import("@/lib/orchestrator");
    expect(mod.runSingleTurn).toBeDefined();
    expect(typeof mod.runSingleTurn).toBe("function");
  });

  it("exports runRoundtableStream", async () => {
    const mod = await import("@/lib/orchestrator");
    expect(mod.runRoundtableStream).toBeDefined();
    expect(typeof mod.runRoundtableStream).toBe("function");
  });
});
