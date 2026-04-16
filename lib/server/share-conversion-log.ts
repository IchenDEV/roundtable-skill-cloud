import "server-only";

export type ShareConversionEvent = "browse" | "copy_link" | "fork_initiated" | "fork_success";

export function logShareConversionEvent(input: {
  token: string;
  event: ShareConversionEvent;
  source?: string;
  visitorId?: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const { token, event, source, visitorId, userId, meta } = input;
  console.info(
    "[share-conversion]",
    JSON.stringify({
      event,
      token,
      source: source ?? "unknown",
      visitorId: visitorId ?? null,
      userId: userId ?? null,
      meta: meta ?? {},
      ts: new Date().toISOString(),
    })
  );
}
