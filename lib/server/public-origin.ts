import { headers } from "next/headers";

function allowedHostnames(): Set<string> {
  const s = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      s.add(new URL(site).hostname);
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    s.add(vercel.replace(/^https?:\/\//, "").split("/")[0] ?? vercel);
  }
  if (process.env.NODE_ENV === "development") {
    s.add("localhost");
    s.add("127.0.0.1");
  }
  return s;
}

/** 生成绝对站址（分享链接）；优先 NEXT_PUBLIC_SITE_URL；否则仅在 Host 属于允许列表时从请求头推断 */
export async function resolvePublicOrigin(): Promise<string | null> {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;

  const h = await headers();
  const hostHeader = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!hostHeader) return null;

  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  const allowed = allowedHostnames();
  if (allowed.size === 0) {
    return null;
  }
  if (!allowed.has(hostname)) {
    return null;
  }

  return `${proto}://${hostHeader}`;
}
