import { describe, expect, it } from "vitest";
import { defaultDebateDispatch, defaultDispatch, parseDispatchBlock } from "@/lib/orchestrator/parse-dispatch";

describe("parseDispatchBlock", () => {
  it("parses valid dispatch json block", () => {
    const text = [
      "开场",
      "```json:dispatch",
      '[{"action":"attack","skillId":"a","target":"b","directive":"先打定义漏洞"}]',
      "```",
    ].join("\n");
    expect(parseDispatchBlock(text, ["a", "b"])).toEqual([
      { action: "attack", skillId: "a", target: "b", directive: "先打定义漏洞" },
    ]);
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

describe("defaultDebateDispatch", () => {
  it("builds attack defend judge triplets", () => {
    expect(defaultDebateDispatch(["a", "b"])).toEqual([
      { action: "attack", skillId: "a", target: "b", directive: "只打一处最要命的漏洞，不准铺陈立场。" },
      { action: "defend", skillId: "b", target: "a", directive: "先正面回答，再补一记反击，不准绕开。" },
      { action: "judge", skillId: "a", target: "b", directive: "指出谁答偏了，下一手该继续追哪一点。" },
    ]);
  });
});
