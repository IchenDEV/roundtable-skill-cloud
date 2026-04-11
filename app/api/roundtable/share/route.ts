import { insertShareSnapshot } from "@/lib/db/share-snapshot";
import { resolvePublicOrigin } from "@/lib/server/public-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sharePayloadSchema } from "@/lib/spec/share-payload";
import { roundtableStateSchema } from "@/lib/spec/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  state: roundtableStateSchema,
  skillNames: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体无效。" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "状态格式不对。" }, { status: 400 });
  }

  const { state, skillNames } = parsed.data;
  const supabase = await createSupabaseServerClient();
  let ownerId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    ownerId = user?.id ?? null;
  }

  const stateRest = { ...state };
  delete stateRest.sessionId;
  const payload = sharePayloadSchema.parse({
    v: 1,
    state: stateRest,
    skillNames: skillNames ?? {},
  });

  const token = await insertShareSnapshot(payload, ownerId);
  if (!token) {
    return NextResponse.json(
      { error: "未能生成分享（请配置 SUPABASE_SERVICE_ROLE_KEY 并执行 003 迁移）。" },
      { status: 503 }
    );
  }

  const path = `/roundtable/share/${token}`;
  const origin = await resolvePublicOrigin();
  const url = origin ? `${origin}${path}` : path;
  return NextResponse.json({ token, path, url });
}
