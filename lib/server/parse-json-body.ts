import { MAX_JSON_BODY_BYTES } from "../spec/constants";
import type { z } from "zod";

type ParseOk<T> = { ok: true; data: T };
type ParseErr = { ok: false; error: string; status: number };

/** Content-Length 上限 + JSON 解析 + Zod 校验，stream 与 share 共用。 */
export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<ParseOk<T> | ParseErr> {
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_JSON_BODY_BYTES) {
    return { ok: false, error: "请求体过大。", status: 413 };
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, error: "请求体无效。", status: 400 };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "信息格式不对，请刷新页面后再试。", status: 400 };
  }
  return { ok: true, data: parsed.data };
}
