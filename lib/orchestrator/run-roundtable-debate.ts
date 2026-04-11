import { streamModeratorTurn, summarizeModeratorMemory } from "./agents/moderator-agent";
import { streamDebateParticipantDeepAgent } from "./agents/participant-deepagent";
import type { RoundtableState, StreamEvent, TranscriptEntry } from "../spec/schema";
import { getSkillById } from "../skills/lookup";
import { loadModeratorDebatePrompt } from "./moderator-load";
import { formatTranscript } from "./format-context";
import { nowIso, runSynthesisPhase } from "./shared-phases";
import { parseDispatchBlock, defaultDispatch } from "./parse-dispatch";
import type { RunRoundtableParams } from "../spec/orchestrator-port";

/**
 * 多代理圆桌（辩论模式）：主持输出调度指令，编排按指令调度各席交叉质询。
 */
export async function* runRoundtableDebate(params: RunRoundtableParams): AsyncGenerator<StreamEvent, RoundtableState> {
  const { state: input, manifest, resolveLlm, model: modelOverride } = params;
  const modPrompt = loadModeratorDebatePrompt();
  const { runtime, model: resolvedModel } = await resolveLlm();
  const m = modelOverride ?? resolvedModel;

  let state: RoundtableState = { ...input, error: undefined };

  if (state.userCommand === "stop" || state.round >= state.maxRounds) {
    return yield* runSynthesisPhase(runtime, m, modPrompt, state);
  }

  const roundLabel = state.round + 1;
  const ctx = formatTranscript(state.transcript);

  // 主持辩论开场（要求输出调度指令）
  const openUser =
    state.transcript.length === 0
      ? `议题：${state.topic}\n列席代理 skillId：${state.participantSkillIds.join(", ")}\n请开场：锚定核心争点，分析各席可能立场，然后输出本轮调度指令（JSON 格式）。`
      : `当前第 ${roundLabel} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n主持人记忆：${state.moderatorMemory || "（无）"}\n请根据上轮交锋结果，提出本轮引导问题并输出新的调度指令。`;

  let modOpen = "";
  for await (const ev of streamModeratorTurn(runtime, m, modPrompt, openUser)) {
    if (ev.type === "turn_complete") modOpen = ev.fullText;
    yield ev;
  }

  state = {
    ...state,
    transcript: [...state.transcript, { role: "moderator", content: modOpen, ts: nowIso() }],
  };

  // 解析调度指令
  const dispatch = parseDispatchBlock(modOpen, state.participantSkillIds) ?? defaultDispatch(state.participantSkillIds);

  // 按调度序逐一调用列席
  for (const step of dispatch) {
    const sk = getSkillById(manifest, step.skillId);
    if (!sk) {
      yield { type: "error", message: `Unknown skill: ${step.skillId}` };
      state = { ...state, phase: "error", error: `Unknown skill: ${step.skillId}` };
      return state;
    }
    const tctx = formatTranscript(state.transcript);
    let spoke = "";
    for await (const ev of streamDebateParticipantDeepAgent(runtime, m, sk, tctx, step.target, step.directive)) {
      if (ev.type === "turn_complete") spoke = ev.fullText;
      yield ev;
    }
    const entry: TranscriptEntry = {
      role: "speaker",
      skillId: step.skillId,
      content: spoke,
      contentHashSnapshot: sk.contentHash,
      ts: nowIso(),
    };
    state = { ...state, transcript: [...state.transcript, entry] };
  }

  // 主持辩论收束
  const wrapCtx = formatTranscript(state.transcript);
  const wrapUser = `本轮交锋已毕。请：1）指出论证最薄弱的一席及其逻辑漏洞；2）给「主持人记忆」一段话供下轮使用；3）提出下轮引导问题。记录中含席上用户插话须一并考虑。`;

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
