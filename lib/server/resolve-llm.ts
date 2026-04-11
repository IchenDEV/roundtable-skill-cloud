import { createSupabaseServerClient } from "../supabase/server";
import { decryptSecret } from "../crypto/byok-crypto";
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_OPENAI_MODEL, defaultApiBaseUrl, type ByokProvider } from "../spec/constants";
import type { ResolvedLlm } from "../llm/types";

/**
 * 解析当前用户选用的执笔后端与模型（开发机可用 DEV_LLM_* 旁路）。
 */
export async function resolveLlm(): Promise<ResolvedLlm> {
  const dev = process.env.DEV_LLM_API_KEY;
  if (process.env.NODE_ENV === "development" && dev?.trim()) {
    const prov = (process.env.DEV_LLM_PROVIDER as ByokProvider) || "openai";
    const customBase = process.env.DEV_LLM_BASE_URL?.trim();
    const model =
      prov === "anthropic"
        ? process.env.DEFAULT_ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL
        : process.env.DEFAULT_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
    if (prov === "anthropic") {
      return {
        runtime: { kind: "anthropic", apiKey: dev.trim(), provider: "anthropic" },
        model,
      };
    }
    const base = customBase || defaultApiBaseUrl(prov) || "https://api.openai.com/v1";
    return {
      runtime: { kind: "openai_compat", apiKey: dev.trim(), baseURL: base, provider: prov },
      model,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("本站尚未接通账户库，无法代你执笔。");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("请先登入，并在砚台里保存你的执笔授权。");

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider, default_model")
    .eq("user_id", user.id)
    .maybeSingle();

  const active = (settings?.active_provider as ByokProvider) || "openai";

  const { data: row, error } = await supabase
    .from("user_provider_credentials")
    .select("ciphertext, api_base_url")
    .eq("user_id", user.id)
    .eq("provider", active)
    .maybeSingle();

  if (error) throw new Error("读取你的凭据时受阻，请稍后再试。");
  if (!row?.ciphertext) throw new Error("请先在砚台里保存你的执笔授权。");

  let plain: string;
  try {
    plain = decryptSecret(row.ciphertext);
  } catch {
    throw new Error("凭据无法解读，请联系站点维护者。");
  }

  const model =
    settings?.default_model?.trim() || (active === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  if (active === "anthropic") {
    return {
      runtime: { kind: "anthropic", apiKey: plain, provider: "anthropic" },
      model,
    };
  }

  const base = row.api_base_url?.trim() || defaultApiBaseUrl(active);
  if (!base) {
    throw new Error("该后端需要填写接口根地址，请在砚台补全后再开席。");
  }

  return {
    runtime: { kind: "openai_compat", apiKey: plain, baseURL: base, provider: active },
    model,
  };
}
