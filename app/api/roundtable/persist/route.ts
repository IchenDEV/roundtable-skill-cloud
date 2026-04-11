import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import { roundtableStateSchema } from "@/lib/spec/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  state: roundtableStateSchema,
});

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return new Response(JSON.stringify({ error: body.error }), {
      status: body.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const isDev = process.env.NODE_ENV === "development" && !!process.env.DEV_LLM_API_KEY?.trim();
  if (!isDev) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return new Response(JSON.stringify({ error: "服务端未配置账户库。" }), {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "请先登入。" }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  }

  try {
    await persistRoundtableState(body.data.state);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "persist failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
