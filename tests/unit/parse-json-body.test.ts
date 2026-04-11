import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJsonBody } from "@/lib/server/parse-json-body";

describe("parseJsonBody", () => {
  const schema = z.object({ topic: z.string().min(1) });

  it("rejects oversized content-length before parsing", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "content-length": "999999999" },
      body: JSON.stringify({ topic: "t" }),
    });
    await expect(parseJsonBody(req, schema)).resolves.toEqual({ ok: false, error: "请求体过大。", status: 413 });
  });

  it("rejects invalid json and schema mismatch", async () => {
    const badJson = new Request("https://example.com", { method: "POST", body: "{" });
    await expect(parseJsonBody(badJson, schema)).resolves.toEqual({ ok: false, error: "请求体无效。", status: 400 });

    const badShape = new Request("https://example.com", { method: "POST", body: JSON.stringify({ topic: "" }) });
    await expect(parseJsonBody(badShape, schema)).resolves.toEqual({
      ok: false,
      error: "信息格式不对，请刷新页面后再试。",
      status: 400,
    });
  });

  it("returns parsed payload on success", async () => {
    const req = new Request("https://example.com", { method: "POST", body: JSON.stringify({ topic: "议题" }) });
    await expect(parseJsonBody(req, schema)).resolves.toEqual({ ok: true, data: { topic: "议题" } });
  });
});
