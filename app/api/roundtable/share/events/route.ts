import { logShareConversionEvent, type ShareConversionEvent } from "@/lib/server/share-conversion-log";
import { buildServerRequestContext } from "@/lib/server/request-context";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const shareEventSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{32}$/i),
  event: z.enum(["browse", "copy_link", "fork_initiated", "fork_success"] satisfies ShareConversionEvent[]),
  source: z.string().max(120).optional(),
  visitorId: z.string().max(120).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, shareEventSchema);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const ctx = await buildServerRequestContext(undefined, { allowDevBypass: true });
  logShareConversionEvent({
    token: parsed.data.token.toLowerCase(),
    event: parsed.data.event,
    source: parsed.data.source,
    visitorId: parsed.data.visitorId,
    userId: ctx.userId,
    meta: parsed.data.meta,
  });
  return NextResponse.json({ ok: true });
}
