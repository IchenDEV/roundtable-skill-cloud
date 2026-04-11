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

  const messages = state.transcript.map((t, position_idx) => ({
    role: t.role,
    skill_id: t.skillId ?? null,
    content: t.content,
    content_hash: t.contentHashSnapshot ?? null,
    position_idx,
  }));

  const { error } = await supabase.rpc("persist_roundtable_state", {
    p_session_id: state.sessionId,
    p_topic: state.topic,
    p_mode: state.mode,
    p_participant_skill_ids: state.participantSkillIds,
    p_max_rounds: state.maxRounds,
    p_current_round: state.round,
    p_phase: state.phase,
    p_moderator_memory: state.moderatorMemory,
    p_synthesis: state.synthesis ?? null,
    p_messages: messages,
  });

  if (error) {
    console.error("persist session", error.message);
    throw new Error("旧席未能落库，请稍后再试。");
  }
}
