import { persistRoundtableState } from "@/lib/db/persist-roundtable";
import { roundtableStateSchema } from "@/lib/spec/schema";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import {
  asServerUserContext,
  buildServerRequestContext,
  jsonError,
  requireAuthenticatedUser,
} from "@/lib/server/request-context";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  state: roundtableStateSchema,
});

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return jsonError(body.error, body.status);
  }

  const ctx = await buildServerRequestContext(req, { allowDevBypass: true });
  const authError = requireAuthenticatedUser(ctx, {
    noStoreMessage: "服务端未配置账户库。",
    unauthenticatedMessage: "请先登入。",
  });
  if (authError) return authError;
  if (ctx.devBypass) return Response.json({ ok: true });

  try {
    await persistRoundtableState(body.data.state, asServerUserContext(ctx)!);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "persist failed";
    return jsonError(msg, 500);
  }
}
