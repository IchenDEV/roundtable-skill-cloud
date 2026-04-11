import { insertShareSnapshot } from "@/lib/db/share-snapshot";
import { resolvePublicOrigin } from "@/lib/server/public-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { skillNamesSchema } from "@/lib/spec/share-payload";
import { roundtableStateSchema } from "@/lib/spec/schema";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import type { SharePayload } from "@/lib/spec/share-payload";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  state: roundtableStateSchema,
  skillNames: skillNamesSchema.optional(),
});

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }

  const { state, skillNames } = body.data;
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
  const payload: SharePayload = {
    v: 1,
    state: stateRest,
    skillNames: skillNames ?? {},
  };

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
