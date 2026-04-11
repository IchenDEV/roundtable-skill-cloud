import "server-only";
import { randomBytes } from "crypto";
import { createSupabaseServiceRole } from "../supabase/server";
import { sharePayloadSchema, type SharePayload } from "../spec/share-payload";

export async function insertShareSnapshot(payload: SharePayload, ownerId: string | null): Promise<string | null> {
  const sb = createSupabaseServiceRole();
  if (!sb) return null;
  const token = randomBytes(16).toString("hex");
  const { error } = await sb.from("roundtable_share_snapshots").insert({
    token,
    owner_id: ownerId,
    payload,
  });
  if (error) {
    console.error("insert share", error.message);
    return null;
  }
  return token;
}

export async function fetchSharePayloadByToken(token: string): Promise<SharePayload | null> {
  if (!/^[a-f0-9]{32}$/i.test(token)) return null;
  const sb = createSupabaseServiceRole();
  if (!sb) return null;
  const { data, error } = await sb
    .from("roundtable_share_snapshots")
    .select("payload")
    .eq("token", token)
    .maybeSingle();
  if (error || !data?.payload) {
    if (error) console.error("fetch share", error.message);
    return null;
  }
  const parsed = sharePayloadSchema.safeParse(data.payload);
  if (!parsed.success) return null;
  return parsed.data;
}
