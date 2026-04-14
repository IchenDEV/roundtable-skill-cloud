import { encryptSecret } from "@/lib/crypto/byok-crypto";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import {
  asServerUserContext,
  buildServerRequestContext,
  jsonError,
  requireAuthenticatedUser,
} from "@/lib/server/request-context";
import { userCredentialInputSchema } from "@/lib/spec/schema";
import type { ByokProvider } from "@/lib/spec/constants";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await buildServerRequestContext(undefined, { allowDevBypass: true });
  if (!ctx.supabase) {
    return Response.json({
      configured: false,
      devBypass: ctx.devBypass,
    });
  }
  if (!ctx.userId) {
    return Response.json({ configured: true, authenticated: false });
  }

  const userCtx = asServerUserContext(ctx)!;
  const { supabase, userId } = userCtx;

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider, default_model")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: creds } = await supabase
    .from("user_provider_credentials")
    .select("provider, updated_at, api_base_url")
    .eq("user_id", userId);

  const active = (settings?.active_provider as ByokProvider) || "openai";
  const activeRow = creds?.find((c) => c.provider === active);

  return Response.json({
    configured: true,
    authenticated: true,
    activeProvider: active,
    defaultModel: settings?.default_model ?? null,
    apiBaseUrl: activeRow?.api_base_url ?? null,
    providersSaved: creds?.map((c) => c.provider) ?? [],
    hasCredential: !!activeRow,
    updatedAt: activeRow?.updated_at ?? null,
    hasCustomBaseUrl: !!(activeRow?.api_base_url && String(activeRow.api_base_url).trim()),
  });
}

export async function POST(req: Request) {
  const ctx = await buildServerRequestContext();
  const authError = requireAuthenticatedUser(ctx, {
    noStoreMessage: "本站账户库尚未接通，暂时无法保存。",
    unauthenticatedMessage: "请先登入。",
  });
  if (authError) return authError;

  const parsed = await parseJsonBody(req, userCredentialInputSchema);
  if (!parsed.ok) return jsonError(parsed.error, parsed.status);

  const { supabase, userId } = asServerUserContext(ctx)!;

  let ciphertext: string;
  try {
    ciphertext = encryptSecret(parsed.data.apiKey);
  } catch {
    return jsonError("保存时受阻，请联系站点维护者。", 500);
  }

  const apiBase = parsed.data.apiBaseUrl?.trim() || null;

  const { error: credErr } = await supabase
    .from("user_provider_credentials")
    .upsert(
      {
        user_id: userId,
        provider: parsed.data.provider,
        ciphertext,
        label: parsed.data.label ?? null,
        api_base_url: apiBase,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    )
    .select("id");

  if (credErr) {
    console.error("credentials upsert", credErr.code, credErr.message, credErr.details);
    return Response.json({ error: `未能写入：${credErr.message}` }, { status: 500 });
  }

  const { error: setErr } = await supabase
    .from("user_llm_settings")
    .upsert(
      {
        user_id: userId,
        active_provider: parsed.data.provider,
        default_model: parsed.data.defaultModel?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id");

  if (setErr) {
    console.error("llm_settings upsert", setErr.code, setErr.message, setErr.details);
    return Response.json({ error: `未能保存选用设置：${setErr.message}` }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE() {
  const ctx = await buildServerRequestContext();
  const authError = requireAuthenticatedUser(ctx, {
    noStoreMessage: "本站账户库尚未接通，暂时无法保存。",
    unauthenticatedMessage: "请先登入。",
  });
  if (authError) return authError;
  const { supabase, userId } = asServerUserContext(ctx)!;

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider")
    .eq("user_id", userId)
    .maybeSingle();

  const active = settings?.active_provider ?? "openai";
  await supabase.from("user_provider_credentials").delete().eq("user_id", userId).eq("provider", active);

  return Response.json({ ok: true });
}
