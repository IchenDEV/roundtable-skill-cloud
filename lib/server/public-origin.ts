import { headers } from "next/headers";

/** 生成绝对站址（分享链接）；优先 NEXT_PUBLIC_SITE_URL */
export async function resolvePublicOrigin(): Promise<string | null> {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return null;
  return `${proto}://${host}`;
}
