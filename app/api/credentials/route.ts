import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto/byok-crypto";
import { userCredentialInputSchema } from "@/lib/spec/schema";
import type { ByokProvider } from "@/lib/spec/constants";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({
      configured: false,
      devBypass: !!process.env.DEV_LLM_API_KEY,
    });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ configured: true, authenticated: false });
  }

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider, default_model")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: creds } = await supabase
    .from("user_provider_credentials")
    .select("provider, updated_at, api_base_url")
    .eq("user_id", user.id);

  const active = (settings?.active_provider as ByokProvider) || "openai";
  const activeRow = creds?.find((c) => c.provider === active);

  return Response.json({
    configured: true,
    authenticated: true,
    activeProvider: active,
    defaultModel: settings?.default_model ?? null,
    providersSaved: creds?.map((c) => c.provider) ?? [],
    hasCredential: !!activeRow,
    updatedAt: activeRow?.updated_at ?? null,
    hasCustomBaseUrl: !!(activeRow?.api_base_url && String(activeRow.api_base_url).trim()),
  });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "本站账户库尚未接通，暂时无法保存。" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "请先登入。" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = userCredentialInputSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first?.message ?? "请检查输入内容后重试。" }, { status: 400 });
  }

  let ciphertext: string;
  try {
    ciphertext = encryptSecret(parsed.data.apiKey);
  } catch {
    return Response.json({ error: "保存时受阻，请联系站点维护者。" }, { status: 500 });
  }

  const apiBase = parsed.data.apiBaseUrl?.trim() || null;

  const { error: credErr } = await supabase.from("user_provider_credentials").upsert(
    {
      user_id: user.id,
      provider: parsed.data.provider,
      ciphertext,
      label: parsed.data.label ?? null,
      api_base_url: apiBase,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (credErr) {
    return Response.json({ error: "未能写入，请稍后再试。" }, { status: 500 });
  }

  const { error: setErr } = await supabase.from("user_llm_settings").upsert(
    {
      user_id: user.id,
      active_provider: parsed.data.provider,
      default_model: parsed.data.defaultModel?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (setErr) {
    return Response.json({ error: "未能保存当前选用设置，请稍后再试。" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "本站账户库尚未接通，暂时无法保存。" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "请先登入。" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider")
    .eq("user_id", user.id)
    .maybeSingle();

  const active = settings?.active_provider ?? "openai";
  await supabase.from("user_provider_credentials").delete().eq("user_id", user.id).eq("provider", active);

  return Response.json({ ok: true });
}
