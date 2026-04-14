import { deleteRoundtableSession, getRoundtableSessionState } from "@/lib/db/roundtable-sessions";
import { asServerUserContext, buildServerRequestContext, requireAuthenticatedUser } from "@/lib/server/request-context";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const requestCtx = await buildServerRequestContext();
  const authError = requireAuthenticatedUser(requestCtx, {
    noStoreMessage: "服务端未配置会话库。",
    unauthenticatedMessage: "须先登入。",
  });
  if (authError) return authError;

  const state = await getRoundtableSessionState(asServerUserContext(requestCtx)!, id);
  if (!state) {
    return NextResponse.json({ error: "未找到该席，或无权查看。" }, { status: 404 });
  }
  return NextResponse.json({ state });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const requestCtx = await buildServerRequestContext();
  const authError = requireAuthenticatedUser(requestCtx, {
    noStoreMessage: "服务端未配置会话库。",
    unauthenticatedMessage: "须先登入。",
  });
  if (authError) return authError;

  const ok = await deleteRoundtableSession(asServerUserContext(requestCtx)!, id);
  if (!ok) {
    return NextResponse.json({ error: "未能撤席。" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
