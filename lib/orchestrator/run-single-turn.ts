import { streamModeratorTurn, summarizeModeratorMemory, streamModeratorSynthesis } from "./agents/moderator-agent";
import { streamParticipantTurn, streamDebateParticipantTurn } from "./agents/participant-agent";
import type { TurnResponseEvent, TurnRequest } from "../spec/schema";
import { getSkillById } from "../skills/lookup";
import { loadModeratorPrompt, loadModeratorDebatePrompt } from "./moderator-load";
import { formatTranscript, formatTranscriptForSeat } from "./format-context";
import { parseDispatchBlock, defaultDebateDispatch } from "./parse-dispatch";
import type { SkillManifest } from "../skills/types";
import type { ResolvedLlm } from "../llm/types";
import { getSkillDisplay } from "../skills/skill-display";
import { buildUserInterjectionNote, hasPendingUserInterjection } from "./user-interjection-context";
import { deriveRoundSection, deriveSpeakerStructured } from "./turn-structured";

function buildSkillNames(ids: string[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const id of ids) {
    names[id] = getSkillDisplay(id).label;
  }
  return names;
}

export type SingleTurnParams = {
  request: TurnRequest;
  manifest: SkillManifest;
  resolved: ResolvedLlm;
  signal?: AbortSignal;
};

function buildDebateJudgeUserMessage(params: {
  topic: string;
  transcript: string;
  attacker?: string;
  defender?: string;
  directive?: string;
  userInterjectionNote: string;
}) {
  const { topic, transcript, attacker, defender, directive, userInterjectionNote } = params;
  const duelLabel =
    attacker && defender ? `刚才这轮交叉质询由【${attacker}】追打【${defender}】。` : "刚才这轮交叉质询已经结束。";
  const focus = directive ? `争点限定：${directive}` : "请直接指出谁打空了，谁没回答。";

  return `议题：${topic}

${duelLabel}
${focus}

【席上插话状态】
${userInterjectionNote}

【当前全文记录】
${transcript}

请只输出一小段主持插刀，完成三件事：
1. 判刚才谁占上风，谁在回避；
2. 点出最该继续追的一处漏洞；
3. 用一句狠话把下一手逼出来。

限制：
- 只许说主持人的话；
- 不许替任何列席写台词；
- 控制在 120 字内；
- 不要输出 JSON。`;
}

/**
 * Run a single turn step (moderator_open, participant, moderator_wrap, or synthesis).
 * Yields TurnResponseEvent events. Does NOT mutate state — the client builds the next state.
 */
export async function* runSingleTurn(params: SingleTurnParams): AsyncGenerator<TurnResponseEvent> {
  const { request, manifest, resolved, signal } = params;
  const { state, step } = request;
  const { runtime, model } = resolved;
  const skillNames = buildSkillNames(state.participantSkillIds);
  const isDebate = state.mode === "debate";
  const modPrompt = isDebate ? loadModeratorDebatePrompt() : loadModeratorPrompt();

  switch (step) {
    case "moderator_open": {
      const ctx = formatTranscript(state.transcript, skillNames);
      const roster = state.participantSkillIds.map((id) => `${skillNames[id]}（${id}）`).join("、");
      const userInterjectionNote = buildUserInterjectionNote(state.transcript, "moderator_open");
      const hasNewUserInterjection = hasPendingUserInterjection(state.transcript, "moderator_open");

      let openUser: string;
      if (isDebate) {
        openUser =
          state.transcript.length === 0
            ? `议题：${state.topic}\n列席代理：${roster}\n请开场：锚定核心争点，分析各席可能立场，然后输出本轮调度指令（JSON 格式，skillId 字段用括号中的 ID）。`
            : `当前第 ${state.round + 1} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n${userInterjectionNote}\n主持人记忆：${state.moderatorMemory || "（无）"}\n请根据上轮交锋结果，提出本轮引导问题并输出新的调度指令。${hasNewUserInterjection ? "本轮必须把最新席上插话纳入调度。" : "本轮没有新增席上插话，不得假定用户刚刚补充了观点。"} `;
      } else {
        openUser =
          state.transcript.length === 0
            ? `议题：${state.topic}\n列席代理：${roster}\n请开场：统一核心概念、提出定义性问题，并说明本轮规则（每位末句都须有「简言之」）。`
            : `当前第 ${state.round + 1} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n${userInterjectionNote}\n请根据「主持人记忆」推进：${state.moderatorMemory || "（无）"}\n提出本轮引导问题。${hasNewUserInterjection ? "若本轮确有新增席上插话，要明确提醒列席回应它。" : "本轮没有新增席上插话，不得暗示用户刚刚发过言。"} `;
      }

      let fullText = "";
      for await (const ev of streamModeratorTurn(
        runtime,
        model,
        modPrompt,
        openUser,
        Object.values(skillNames),
        signal
      )) {
        if (ev.type === "turn_complete") fullText = ev.fullText;
        yield ev as TurnResponseEvent;
      }

      if (isDebate && fullText) {
        const dispatch =
          parseDispatchBlock(fullText, state.participantSkillIds) ?? defaultDebateDispatch(state.participantSkillIds);
        yield { type: "dispatch", steps: dispatch };
      }

      yield { type: "done" };
      return;
    }

    case "participant": {
      const { skillId, target, directive, action } = request;
      if (!skillId) throw new Error("participant step requires skillId");
      const sk = getSkillById(manifest, skillId);
      if (!sk) throw new Error(`Unknown skill: ${skillId}`);

      const tctx = formatTranscriptForSeat(state.transcript, skillId, skillNames);
      const displayName = skillNames[skillId];
      const userInterjectionNote = buildUserInterjectionNote(state.transcript, "participant");

      let participantFullText = "";
      if (isDebate) {
        const targetDisplay = target ? skillNames[target] || target : undefined;
        for await (const ev of streamDebateParticipantTurn(
          runtime,
          model,
          sk,
          tctx,
          displayName,
          userInterjectionNote,
          action === "attack" || action === "defend" ? action : undefined,
          targetDisplay,
          directive,
          Object.values(skillNames),
          signal
        )) {
          if (ev.type === "turn_complete") participantFullText = ev.fullText;
          yield ev as TurnResponseEvent;
        }
      } else {
        for await (const ev of streamParticipantTurn(
          runtime,
          model,
          sk,
          tctx,
          displayName,
          userInterjectionNote,
          Object.values(skillNames),
          signal
        )) {
          if (ev.type === "turn_complete") participantFullText = ev.fullText;
          yield ev as TurnResponseEvent;
        }
      }

      if (participantFullText && !signal?.aborted) {
        const structured = deriveSpeakerStructured(participantFullText);
        yield {
          type: "turn_structured",
          skillId,
          ...structured,
        };
      }

      yield { type: "done" };
      return;
    }

    case "moderator_judge": {
      const ctx = formatTranscript(state.transcript, skillNames);
      const attacker = request.skillId ? skillNames[request.skillId] || request.skillId : undefined;
      const defender = request.target ? skillNames[request.target] || request.target : undefined;
      const userInterjectionNote = buildUserInterjectionNote(state.transcript, "moderator_wrap");
      const judgeUser = buildDebateJudgeUserMessage({
        topic: state.topic,
        transcript: ctx,
        attacker,
        defender,
        directive: request.directive,
        userInterjectionNote,
      });

      for await (const ev of streamModeratorTurn(
        runtime,
        model,
        modPrompt,
        judgeUser,
        Object.values(skillNames),
        signal
      )) {
        yield ev as TurnResponseEvent;
      }

      yield { type: "done" };
      return;
    }

    case "moderator_wrap": {
      const wrapCtx = formatTranscript(state.transcript, skillNames);
      const userInterjectionNote = buildUserInterjectionNote(state.transcript, "moderator_wrap");
      const wrapUser = isDebate
        ? `本轮交锋已毕。请输出三段结构并点名席位：\n# 共识\n- 内容（席位：skillId 列表）\n# 分歧\n- 内容（席位：skillId 列表）\n# 待证据补强\n- 内容（席位：skillId 列表）\n然后再给出：1）指出论证最薄弱的一席及其逻辑漏洞；2）给「主持人记忆」一段话供下轮使用；3）提出下轮引导问题。${userInterjectionNote}`
        : `本轮发言已齐。请输出三段结构并点名席位：\n# 共识\n- 内容（席位：skillId 列表）\n# 分歧\n- 内容（席位：skillId 列表）\n# 待证据补强\n- 内容（席位：skillId 列表）\n然后再给出：1）提炼最深争点；2）给「主持人记忆」一段话供下轮使用；3）提出下一层引导问题。${userInterjectionNote}`;

      let wrap = "";
      for await (const ev of streamModeratorTurn(
        runtime,
        model,
        modPrompt,
        `${wrapUser}\n\n记录：\n${wrapCtx}`,
        Object.values(skillNames),
        signal
      )) {
        if (ev.type === "turn_complete") wrap = ev.fullText;
        yield ev as TurnResponseEvent;
      }

      if (wrap && !signal?.aborted) {
        yield {
          type: "round_structured",
          consensus: deriveRoundSection(wrap, "共识", state.participantSkillIds),
          disagreements: deriveRoundSection(wrap, "分歧", state.participantSkillIds),
          evidenceNeeded: deriveRoundSection(wrap, "待证据补强", state.participantSkillIds),
        };
        const memory = await summarizeModeratorMemory(runtime, model, wrap, signal);
        yield { type: "memory", text: memory };
      }

      yield { type: "done" };
      return;
    }

    case "synthesis": {
      const ctx = formatTranscript(state.transcript, skillNames);
      const roster = state.participantSkillIds.map((id) => `${skillNames[id] || id}（skillId: ${id}）`).join("、");
      const synBlob = `${modPrompt}\n\n议题：${state.topic}\n列席：${roster}\n\n全文记录：\n${ctx}\n\n请输出最终合成稿，分节：共识 / 分歧 / 开放问题 / 可执行结论。分歧表中须使用各席的席名而非"席上"。`;

      let syn = "";
      for await (const ev of streamModeratorSynthesis(runtime, model, synBlob, signal)) {
        if (ev.type === "turn_complete") {
          syn = ev.fullText;
          continue;
        }
        yield ev as TurnResponseEvent;
      }
      yield { type: "synthesis_complete", text: syn };
      yield { type: "done" };
      return;
    }
  }
}
