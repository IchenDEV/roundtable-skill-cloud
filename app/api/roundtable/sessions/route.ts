import { listRoundtableSessions } from "@/lib/db/roundtable-sessions";
import { asServerUserContext, buildServerRequestContext, requireAuthenticatedUser } from "@/lib/server/request-context";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await buildServerRequestContext();
  const authError = requireAuthenticatedUser(ctx, {
    noStoreMessage: "服务端未配置会话库。",
    unauthenticatedMessage: "须先登入。",
  });
  if (authError) return authError;

  const result = await listRoundtableSessions(asServerUserContext(ctx)!);
  if (!result.ok) {
    return NextResponse.json({ error: "旧席录暂不可读。" }, { status: 500 });
  }
  return NextResponse.json({ sessions: result.sessions });
}
