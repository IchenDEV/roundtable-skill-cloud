import "server-only";
import type { RoundtableState } from "../spec/schema";
import type { ServerUserContext } from "../server/request-context";

/** 将圆桌状态写入 Postgres（RLS）；调用方需已完成鉴权。 */
export async function persistRoundtableState(state: RoundtableState, ctx: ServerUserContext): Promise<void> {
  if (!state.sessionId) return;
  const { supabase } = ctx;

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
