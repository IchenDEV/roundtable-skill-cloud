import { streamModeratorTurn, summarizeModeratorMemory } from "./agents/moderator-agent";
import { streamParticipantDeepAgent } from "./agents/participant-deepagent";
import type { RoundtableState, StreamEvent, TranscriptEntry } from "../spec/schema";
import { getSkillById } from "../skills/lookup";
import { loadModeratorPrompt } from "./moderator-load";
import { formatTranscript } from "./format-context";
import { nowIso, runSynthesisPhase } from "./shared-phases";
import type { RunRoundtableParams } from "../spec/orchestrator-port";

/**
 * 多代理圆桌（讨论模式）：主持代理与每位列席代理各自独立模型调用；列席仅加载本席 Skill。
 */
export async function* runRoundtableGraph(params: RunRoundtableParams): AsyncGenerator<StreamEvent, RoundtableState> {
  const { state: input, manifest, resolveLlm, model: modelOverride } = params;
  const modPrompt = loadModeratorPrompt();
  const { runtime, model: resolvedModel } = await resolveLlm();
  const m = modelOverride ?? resolvedModel;

  let state: RoundtableState = { ...input, error: undefined };

  if (state.userCommand === "stop" || state.round >= state.maxRounds) {
    return yield* runSynthesisPhase(runtime, m, modPrompt, state);
  }

  const roundLabel = state.round + 1;
  const ctx = formatTranscript(state.transcript);

  const openUser =
    state.transcript.length === 0
      ? `议题：${state.topic}\n列席代理 skillId：${state.participantSkillIds.join(", ")}\n请开场：统一核心概念、提出定义性问题，并说明本轮规则（每位须回应前文含「席上」用户插话，末句「简言之」）。`
      : `当前第 ${roundLabel} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n请根据「主持人记忆」推进：${state.moderatorMemory || "（无）"}\n提出本轮引导问题。`;

  let modOpen = "";
  for await (const ev of streamModeratorTurn(runtime, m, modPrompt, openUser)) {
    if (ev.type === "turn_complete") modOpen = ev.fullText;
    yield ev;
  }

  state = {
    ...state,
    transcript: [...state.transcript, { role: "moderator", content: modOpen, ts: nowIso() }],
  };

  for (const skillId of state.participantSkillIds) {
    const sk = getSkillById(manifest, skillId);
    if (!sk) {
      yield { type: "error", message: `Unknown skill: ${skillId}` };
      state = { ...state, phase: "error", error: `Unknown skill: ${skillId}` };
      return state;
    }
    const tctx = formatTranscript(state.transcript);
    let spoke = "";
    for await (const ev of streamParticipantDeepAgent(runtime, m, sk, tctx)) {
      if (ev.type === "turn_complete") spoke = ev.fullText;
      yield ev;
    }
    const entry: TranscriptEntry = {
      role: "speaker",
      skillId,
      content: spoke,
      contentHashSnapshot: sk.contentHash,
      ts: nowIso(),
    };
    state = { ...state, transcript: [...state.transcript, entry] };
  }

  const wrapCtx = formatTranscript(state.transcript);
  const wrapUser = `本轮发言已齐。请：1）提炼最深争点；2）给「主持人记忆」一段话供下轮使用；3）提出下一层引导问题。记录中含席上用户插话须一并考虑。`;

  let wrap = "";
  for await (const ev of streamModeratorTurn(runtime, m, modPrompt, `${wrapUser}\n\n记录：\n${wrapCtx}`)) {
    if (ev.type === "turn_complete") wrap = ev.fullText;
    yield ev;
  }

  state = {
    ...state,
    round: state.round + 1,
    phase: "await_user",
    moderatorMemory: await summarizeModeratorMemory(runtime, m, wrap),
    transcript: [...state.transcript, { role: "moderator", content: wrap, ts: nowIso() }],
  };

  yield { type: "round_complete", round: state.round };
  yield { type: "done" };
  return state;
}
