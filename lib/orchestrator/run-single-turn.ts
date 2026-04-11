import { streamModeratorTurn, summarizeModeratorMemory, streamModeratorSynthesis } from "./agents/moderator-agent";
import { streamParticipantTurn, streamDebateParticipantTurn } from "./agents/participant-agent";
import type { TurnResponseEvent, TurnRequest } from "../spec/schema";
import { getSkillById } from "../skills/lookup";
import { loadModeratorPrompt, loadModeratorDebatePrompt } from "./moderator-load";
import { formatTranscript, formatTranscriptForSeat } from "./format-context";
import { parseDispatchBlock, defaultDispatch } from "./parse-dispatch";
import type { SkillManifest } from "../skills/types";
import type { ResolvedLlm } from "../llm/types";
import { getSkillDisplay } from "../skills/skill-display";

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

      let openUser: string;
      if (isDebate) {
        openUser =
          state.transcript.length === 0
            ? `议题：${state.topic}\n列席代理：${roster}\n请开场：锚定核心争点，分析各席可能立场，然后输出本轮调度指令（JSON 格式，skillId 字段用括号中的 ID）。`
            : `当前第 ${state.round + 1} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n主持人记忆：${state.moderatorMemory || "（无）"}\n请根据上轮交锋结果，提出本轮引导问题并输出新的调度指令。`;
      } else {
        openUser =
          state.transcript.length === 0
            ? `议题：${state.topic}\n列席代理：${roster}\n请开场：统一核心概念、提出定义性问题，并说明本轮规则（每位须回应前文含「席上」用户插话，末句「简言之」）。`
            : `当前第 ${state.round + 1} 轮。此前记录（含席上用户插话，标为【席上你我】）：\n${ctx}\n请根据「主持人记忆」推进：${state.moderatorMemory || "（无）"}\n提出本轮引导问题。`;
      }

      let fullText = "";
      for await (const ev of streamModeratorTurn(runtime, model, modPrompt, openUser, signal)) {
        if (ev.type === "turn_complete") fullText = ev.fullText;
        yield ev as TurnResponseEvent;
      }

      if (isDebate && fullText) {
        const dispatch =
          parseDispatchBlock(fullText, state.participantSkillIds) ?? defaultDispatch(state.participantSkillIds);
        yield { type: "dispatch", steps: dispatch };
      }

      yield { type: "done" };
      return;
    }

    case "participant": {
      const { skillId, target, directive } = request;
      if (!skillId) throw new Error("participant step requires skillId");
      const sk = getSkillById(manifest, skillId);
      if (!sk) throw new Error(`Unknown skill: ${skillId}`);

      const tctx = formatTranscriptForSeat(state.transcript, skillId, skillNames);
      const displayName = skillNames[skillId];

      if (isDebate) {
        const targetDisplay = target ? skillNames[target] || target : undefined;
        for await (const ev of streamDebateParticipantTurn(
          runtime,
          model,
          sk,
          tctx,
          displayName,
          targetDisplay,
          directive,
          signal
        )) {
          yield ev as TurnResponseEvent;
        }
      } else {
        for await (const ev of streamParticipantTurn(runtime, model, sk, tctx, displayName, signal)) {
          yield ev as TurnResponseEvent;
        }
      }

      yield { type: "done" };
      return;
    }

    case "moderator_wrap": {
      const wrapCtx = formatTranscript(state.transcript, skillNames);
      const wrapUser = isDebate
        ? `本轮交锋已毕。请：1）指出论证最薄弱的一席及其逻辑漏洞；2）给「主持人记忆」一段话供下轮使用；3）提出下轮引导问题。记录中含席上用户插话须一并考虑。`
        : `本轮发言已齐。请：1）提炼最深争点；2）给「主持人记忆」一段话供下轮使用；3）提出下一层引导问题。记录中含席上用户插话须一并考虑。`;

      let wrap = "";
      for await (const ev of streamModeratorTurn(
        runtime,
        model,
        modPrompt,
        `${wrapUser}\n\n记录：\n${wrapCtx}`,
        signal
      )) {
        if (ev.type === "turn_complete") wrap = ev.fullText;
        yield ev as TurnResponseEvent;
      }

      if (wrap && !signal?.aborted) {
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
