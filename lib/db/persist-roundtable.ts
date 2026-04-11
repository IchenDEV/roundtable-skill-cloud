import "server-only";
import { createSupabaseServerClient } from "../supabase/server";
import type { RoundtableState } from "../spec/schema";

/** 将圆桌状态写入 Postgres（RLS）；无登录或 Supabase 未配置时静默跳过 */
export async function persistRoundtableState(state: RoundtableState): Promise<void> {
  if (!state.sessionId) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error: upErr } = await supabase.from("roundtable_sessions").upsert(
    {
      id: state.sessionId,
      user_id: user.id,
      topic: state.topic,
      participant_skill_ids: state.participantSkillIds,
      max_rounds: state.maxRounds,
      current_round: state.round,
      phase: state.phase,
      moderator_memory: state.moderatorMemory,
      synthesis: state.synthesis ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (upErr) {
    console.error("persist session", upErr.message);
    return;
  }

  await supabase.from("roundtable_messages").delete().eq("session_id", state.sessionId).eq("user_id", user.id);

  const rows = state.transcript.map((t, position_idx) => ({
    session_id: state.sessionId,
    user_id: user.id,
    role: t.role,
    skill_id: t.skillId ?? null,
    content: t.content,
    content_hash: t.contentHashSnapshot ?? null,
    position_idx,
  }));

  if (rows.length === 0) return;

  const { error: msgErr } = await supabase.from("roundtable_messages").insert(rows);
  if (msgErr) console.error("persist messages", msgErr.message);
}
