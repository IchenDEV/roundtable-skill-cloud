import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Supabase 若未把 /auth/callback 列入 Redirect URLs，会把 redirect_to 压成 Site URL（常落在 /），PKCE 的 ?code= 会出现在根路径。 */
function authCallbackRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const sp = request.nextUrl.searchParams;
  if (pathname === "/auth/callback" || !sp.has("code")) return null;
  const next = request.nextUrl.clone();
  next.pathname = "/auth/callback";
  return NextResponse.redirect(next);
}

/** 邮件链接错误时常被重定向到 Site URL 根路径，把 query 里的错误转到登录页便于提示。 */
function authErrorOnRootRedirect(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/" || !request.nextUrl.searchParams.get("error")) {
    return null;
  }
  const code = request.nextUrl.searchParams.get("error_code");
  const u = new URL("/login", request.url);
  if (code) u.searchParams.set("auth_error", code);
  return NextResponse.redirect(u);
}

export async function proxy(request: NextRequest) {
  const forwarded = authCallbackRedirect(request);
  if (forwarded) return forwarded;
  const errRedirect = authErrorOnRootRedirect(request);
  if (errRedirect) return errRedirect;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
