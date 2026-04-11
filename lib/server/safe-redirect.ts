/**
 * 防止开放重定向：仅允许站内相对路径（含 query/hash），拒绝 //、协议与异常编码。
 */
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (next == null || typeof next !== "string") return fallback;
  const s = next.trim();
  if (s.length === 0 || s.length > 512) return fallback;
  if (!s.startsWith("/")) return fallback;
  if (s.startsWith("//") || s.startsWith("/\\")) return fallback;
  const pathOnly = /^[^?#]*/.exec(s)?.[0] ?? s;
  if (pathOnly.includes("\\") || /\/\/+/.test(pathOnly)) return fallback;
  const lower = s.toLowerCase();
  if (lower.includes("://") || lower.includes("%2f%2f") || lower.includes("%5c")) return fallback;
  return s;
}
