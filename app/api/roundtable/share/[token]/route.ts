import { fetchSharePayloadByToken } from "@/lib/db/share-snapshot";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** 公开读取分享快照（供客户端或调试） */
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const payload = await fetchSharePayloadByToken(token);
  if (!payload) {
    return NextResponse.json({ error: "未找到或链接无效。" }, { status: 404 });
  }
  return NextResponse.json({ payload });
}
