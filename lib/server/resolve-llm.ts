import { decryptSecret } from "../crypto/byok-crypto";
import { DEFAULT_MODEL_BY_PROVIDER, defaultApiBaseUrl, type ByokProvider } from "../spec/constants";
import type { ResolvedLlm } from "../llm/types";
import type { ServerRequestContext } from "./request-context";

/**
 * 解析当前用户选用的执笔后端与模型（开发机可用 DEV_LLM_* 旁路）。
 */
export async function resolveLlm(
  ctx: Pick<ServerRequestContext, "devBypass" | "supabase" | "userId">
): Promise<ResolvedLlm> {
  const dev = process.env.DEV_LLM_API_KEY;
  if (ctx.devBypass && dev?.trim()) {
    const prov = (process.env.DEV_LLM_PROVIDER as ByokProvider) || "openai";
    const customBase = process.env.DEV_LLM_BASE_URL?.trim();
    const model = process.env.DEV_LLM_MODEL?.trim() || DEFAULT_MODEL_BY_PROVIDER[prov];
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

  const supabase = ctx.supabase;
  const userId = ctx.userId;
  if (!supabase) throw new Error("本站尚未接通账户库，无法代你执笔。");
  if (!userId) throw new Error("请先登入，并在砚台里保存你的执笔授权。");

  const { data: settings } = await supabase
    .from("user_llm_settings")
    .select("active_provider, default_model")
    .eq("user_id", userId)
    .maybeSingle();

  const active = (settings?.active_provider as ByokProvider) || "openai";

  const { data: row, error } = await supabase
    .from("user_provider_credentials")
    .select("ciphertext, api_base_url")
    .eq("user_id", userId)
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

  const model = settings?.default_model?.trim() || DEFAULT_MODEL_BY_PROVIDER[active];

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
