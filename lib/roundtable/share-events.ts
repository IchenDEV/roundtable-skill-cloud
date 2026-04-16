export type ShareEventName = "browse" | "copy_link" | "fork_initiated" | "fork_success";

export async function trackShareEvent(token: string, event: ShareEventName, meta?: Record<string, unknown>) {
  if (!token?.trim()) return;
  try {
    await fetch("/api/roundtable/share/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim(), event, meta }),
      keepalive: true,
    });
  } catch {
    // 埋点失败不影响主流程
  }
}
