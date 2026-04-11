import { describe, expect, it } from "vitest";
import { defaultDispatch, parseDispatchBlock } from "@/lib/orchestrator/parse-dispatch";

describe("parseDispatchBlock", () => {
  it("parses valid dispatch json block", () => {
    const text = ["开场", "```json:dispatch", '[{"skillId":"a","target":"b","directive":"先驳后立"}]', "```"].join(
      "\n"
    );
    expect(parseDispatchBlock(text, ["a", "b"])).toEqual([{ skillId: "a", target: "b", directive: "先驳后立" }]);
  });

  it("filters invalid items and caps triple repeats", () => {
    const text = [
      "```json:dispatch",
      '[{"skillId":"a"},{"skillId":"a"},{"skillId":"a"},{"skillId":"missing"},{"skillId":"b","target":"missing","directive":"  "} ]',
      "```",
    ].join("\n");
    expect(parseDispatchBlock(text, ["a", "b"])).toEqual([{ skillId: "a" }, { skillId: "a" }, { skillId: "b" }]);
  });

  it("returns null for invalid or missing block", () => {
    expect(parseDispatchBlock("```json:dispatch\n{bad json}\n```", ["a"])).toBeNull();
    expect(parseDispatchBlock("无调度块", ["a"])).toBeNull();
  });
});

describe("defaultDispatch", () => {
  it("maps skills in order", () => {
    expect(defaultDispatch(["a", "b"])).toEqual([{ skillId: "a" }, { skillId: "b" }]);
  });
});
