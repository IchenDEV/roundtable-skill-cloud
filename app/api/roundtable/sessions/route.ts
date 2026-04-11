import { listRoundtableSessions } from "@/lib/db/roundtable-sessions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await listRoundtableSessions();
  if (!result.ok) {
    if (result.reason === "unauthorized") {
      return NextResponse.json({ error: "须先登入。" }, { status: 401 });
    }
    if (result.reason === "no_db") {
      return NextResponse.json({ error: "服务端未配置会话库。" }, { status: 503 });
    }
    return NextResponse.json({ error: "旧席录暂不可读。" }, { status: 500 });
  }
  return NextResponse.json({ sessions: result.sessions });
}
