import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import type { RoundtableState, TranscriptEntry } from "../spec/schema";
import { roundtablePhaseSchema } from "../spec/schema";
import type { SessionListItem } from "../roundtable/session-types";

export type { SessionListItem };

function parsePhase(raw: string) {
  const p = roundtablePhaseSchema.safeParse(raw);
  return p.success ? p.data : ("done" as const);
}

function rowToTranscript(
  rows: {
    role: string;
    skill_id: string | null;
    content: string;
    content_hash: string | null;
    created_at: string;
  }[]
): TranscriptEntry[] {
  return rows.map((r) => {
    const role =
      r.role === "moderator" || r.role === "speaker" || r.role === "system" || r.role === "user" ? r.role : "system";
    return {
      role,
      skillId: r.skill_id ?? undefined,
      content: r.content,
      contentHashSnapshot: r.content_hash ?? undefined,
      ts: r.created_at,
    };
  });
}

export type ListSessionsResult =
  | { ok: true; sessions: SessionListItem[] }
  | { ok: false; reason: "no_db" | "unauthorized" | "query_failed" };

export async function listRoundtableSessions(): Promise<ListSessionsResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "no_db" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const { data, error } = await supabase
    .from("roundtable_sessions")
    .select("id, topic, phase, current_round, max_rounds, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("list sessions", error.message);
    return { ok: false, reason: "query_failed" };
  }

  return {
    ok: true,
    sessions: (data ?? []).map((r) => ({
      id: r.id,
      topic: r.topic,
      phase: r.phase,
      currentRound: r.current_round,
      maxRounds: r.max_rounds,
      updatedAt: r.updated_at,
      createdAt: r.created_at,
    })),
  };
}

export async function getRoundtableSessionState(sessionId: string): Promise<RoundtableState | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sess, error: sErr } = await supabase
    .from("roundtable_sessions")
    .select("id, topic, mode, participant_skill_ids, max_rounds, current_round, phase, moderator_memory, synthesis")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sErr || !sess) {
    if (sErr) console.error("get session", sErr.message);
    return null;
  }

  const { data: msgs, error: mErr } = await supabase
    .from("roundtable_messages")
    .select("role, skill_id, content, content_hash, created_at")
    .eq("session_id", sessionId)
    .order("position_idx", { ascending: true });

  if (mErr) {
    console.error("get messages", mErr.message);
    return null;
  }

  return {
    sessionId: sess.id,
    mode: sess.mode === "debate" ? ("debate" as const) : ("discussion" as const),
    topic: sess.topic,
    round: sess.current_round,
    maxRounds: sess.max_rounds,
    phase: parsePhase(sess.phase),
    participantSkillIds: sess.participant_skill_ids ?? [],
    transcript: rowToTranscript(msgs ?? []),
    moderatorMemory: sess.moderator_memory ?? "",
    synthesis: sess.synthesis ?? undefined,
  };
}

export async function deleteRoundtableSession(sessionId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("roundtable_sessions").delete().eq("id", sessionId).eq("user_id", user.id);
  if (error) {
    console.error("delete session", error.message);
    return false;
  }
  return true;
}
