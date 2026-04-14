import { createSupabaseServerClient } from "../supabase/server";
import { clientIpFromRequest } from "./client-ip";

export type ServerSupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type ServerRequestContext = {
  devBypass: boolean;
  supabase: ServerSupabaseClient | null;
  userId: string | null;
  guardKey: string | null;
};

export type ServerUserContext = {
  supabase: ServerSupabaseClient;
  userId: string;
};

export function isDevLlmBypassEnabled() {
  return process.env.NODE_ENV === "development" && !!process.env.DEV_LLM_API_KEY?.trim();
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function buildServerRequestContext(
  req?: Request,
  options: { allowDevBypass?: boolean } = {}
): Promise<ServerRequestContext> {
  const devBypass = !!options.allowDevBypass && isDevLlmBypassEnabled();
  if (devBypass) {
    return {
      devBypass: true,
      supabase: null,
      userId: null,
      guardKey: req ? `dev:${clientIpFromRequest(req)}` : null,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { devBypass: false, supabase: null, userId: null, guardKey: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    devBypass: false,
    supabase,
    userId: user?.id ?? null,
    guardKey: user ? `u:${user.id}` : null,
  };
}

export function requireConfiguredStore(ctx: ServerRequestContext, message: string) {
  if (ctx.devBypass) return null;
  if (ctx.supabase) return null;
  return jsonError(message, 503);
}

export function requireAuthenticatedUser(
  ctx: ServerRequestContext,
  options: { noStoreMessage: string; unauthenticatedMessage: string }
) {
  const storeError = requireConfiguredStore(ctx, options.noStoreMessage);
  if (storeError) return storeError;
  if (ctx.devBypass || ctx.userId) return null;
  return jsonError(options.unauthenticatedMessage, 401);
}

export function asServerUserContext(ctx: ServerRequestContext): ServerUserContext | null {
  if (ctx.devBypass || !ctx.supabase || !ctx.userId) return null;
  return { supabase: ctx.supabase, userId: ctx.userId };
}

export function normalizeUpstreamLlmError(err: unknown) {
  if (!(err instanceof Error)) return "执笔过程中断，请稍后再试。";
  const message = err.message.trim();
  if (!message) return "执笔过程中断，请稍后再试。";
  if (/insufficient[_\s-]?quota|quota|credit balance|额度|余额/i.test(message)) {
    return "执笔后端额度不足，请在砚台更换可用凭据或补充额度后再试。";
  }
  if (/rate limit|too many requests|429/i.test(message)) {
    return "执笔后端当前较拥挤，请稍后再试。";
  }
  if (/network|fetch failed|econnreset|enotfound|timed?out|socket hang up|temporarily unavailable/i.test(message)) {
    return "连接执笔后端时网络异常，请稍后重试。";
  }
  return message;
}
