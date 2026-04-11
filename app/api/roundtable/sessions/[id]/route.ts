import { deleteRoundtableSession, getRoundtableSessionState } from "@/lib/db/roundtable-sessions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "服务端未配置会话库。" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "须先登入。" }, { status: 401 });
  }

  const state = await getRoundtableSessionState(id);
  if (!state) {
    return NextResponse.json({ error: "未找到该席，或无权查看。" }, { status: 404 });
  }
  return NextResponse.json({ state });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "服务端未配置会话库。" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "须先登入。" }, { status: 401 });
  }

  const ok = await deleteRoundtableSession(id);
  if (!ok) {
    return NextResponse.json({ error: "未能撤席。" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
