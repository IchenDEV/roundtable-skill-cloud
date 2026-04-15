"use client";

import { useCallback, useRef, useState } from "react";
import {
  consumeTurnStream,
  persistRoundtableState,
  type DispatchStep,
} from "@/lib/orchestrator/client/consume-turn-stream";
import {
  buildModeratorActiveTurn,
  buildParticipantActiveTurn,
  type RoundtableActiveTurn,
} from "@/lib/roundtable/active-turn";
import type { DebateAction, RoundtableState } from "@/lib/spec/schema";

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException) return err.name === "AbortError";
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /abort/i.test(err.message);
}

function isDebateSpeakerAction(action: DebateAction | undefined): action is "attack" | "defend" {
  return action === "attack" || action === "defend";
}

function formatDebateStepLabel(step: DispatchStep) {
  const actor = step.skillId;
  const target = step.target;
  const action = step.action;

  if (action === "attack") return target ? `${actor} 追打 ${target}` : `${actor} 发起质询`;
  if (action === "defend") return target ? `${actor} 回应 ${target}` : `${actor} 当场应答`;
  if (action === "judge") return target ? `主持插刀：判 ${actor} vs ${target}` : "主持插刀";
  return actor;
}

export type OrchestratorCallbacks = {
  onStateChange: (s: RoundtableState) => void;
  onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => void;
  onTurnComplete: () => void;
  onRoundComplete: () => void;
  onError: (msg: string) => void;
};

export function useRoundtableOrchestrator() {
  const [streaming, setStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTurn, setActiveTurn] = useState<RoundtableActiveTurn>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStreaming(false);
    setCurrentStep(null);
    setActiveTurn(null);
  }, []);

  const runRound = useCallback(async (state: RoundtableState, cbs: OrchestratorCallbacks) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    setStreaming(true);
    setError(null);
    let s = { ...state };

    try {
      setCurrentStep("主持开场");
      setActiveTurn(buildModeratorActiveTurn("moderator_open"));
      let modOpenText = "";
      let dispatch: DispatchStep[] | null = null;

      await consumeTurnStream(
        s,
        "moderator_open",
        {},
        {
          onToken: (role, text, skillId) => cbs.onToken(role, text, skillId),
          onTurnComplete: (_role, fullText) => {
            modOpenText = fullText;
          },
          onDispatch: (steps) => {
            dispatch = steps;
          },
          onMemory: () => {},
          onSynthesis: () => {},
          onError: (msg) => {
            throw new Error(msg);
          },
        },
        signal
      );

      if (signal.aborted) return;
      cbs.onTurnComplete();

      s = {
        ...s,
        transcript: [...s.transcript, { role: "moderator", content: modOpenText, ts: new Date().toISOString() }],
      };
      cbs.onStateChange(s);

      const isDebate = s.mode === "debate";
      const steps: DispatchStep[] =
        isDebate && dispatch ? dispatch : s.participantSkillIds.map((skillId) => ({ skillId }));

      for (const ps of steps) {
        if (signal.aborted) return;

        if (isDebate && ps.action === "judge") {
          setCurrentStep(formatDebateStepLabel(ps));
          setActiveTurn(buildModeratorActiveTurn("moderator_judge", ps));
          let judgeText = "";

          await consumeTurnStream(
            s,
            "moderator_judge",
            ps,
            {
              onToken: (role, text, skillId) => cbs.onToken(role, text, skillId),
              onTurnComplete: (_role, fullText) => {
                judgeText = fullText;
              },
              onDispatch: () => {},
              onMemory: () => {},
              onSynthesis: () => {},
              onError: (msg) => {
                throw new Error(msg);
              },
            },
            signal
          );

          if (signal.aborted) return;
          cbs.onTurnComplete();

          s = {
            ...s,
            transcript: [...s.transcript, { role: "moderator", content: judgeText, ts: new Date().toISOString() }],
          };
          cbs.onStateChange(s);
          continue;
        }

        setCurrentStep(isDebate ? formatDebateStepLabel(ps) : ps.skillId);
        setActiveTurn(buildParticipantActiveTurn(ps));
        let spokeText = "";

        await consumeTurnStream(
          s,
          "participant",
          { ...ps, action: isDebateSpeakerAction(ps.action) ? ps.action : undefined },
          {
            onToken: (role, text, skillId) => cbs.onToken(role, text, skillId),
            onTurnComplete: (_role, fullText) => {
              spokeText = fullText;
            },
            onDispatch: () => {},
            onMemory: () => {},
            onSynthesis: () => {},
            onError: (msg) => {
              throw new Error(msg);
            },
          },
          signal
        );

        if (signal.aborted) return;
        cbs.onTurnComplete();

        s = {
          ...s,
          transcript: [
            ...s.transcript,
            { role: "speaker" as const, skillId: ps.skillId, content: spokeText, ts: new Date().toISOString() },
          ],
        };
        cbs.onStateChange(s);
      }

      if (signal.aborted) return;
      setCurrentStep("主持收束");
      setActiveTurn(buildModeratorActiveTurn("moderator_wrap"));
      let wrapText = "";
      let memory = "";

      await consumeTurnStream(
        s,
        "moderator_wrap",
        {},
        {
          onToken: (role, text, skillId) => cbs.onToken(role, text, skillId),
          onTurnComplete: (_role, fullText) => {
            wrapText = fullText;
          },
          onDispatch: () => {},
          onMemory: (text) => {
            memory = text;
          },
          onSynthesis: () => {},
          onError: (msg) => {
            throw new Error(msg);
          },
        },
        signal
      );

      if (signal.aborted) return;
      cbs.onTurnComplete();

      s = {
        ...s,
        round: s.round + 1,
        phase: "await_user" as const,
        moderatorMemory: memory || s.moderatorMemory,
        transcript: [...s.transcript, { role: "moderator", content: wrapText, ts: new Date().toISOString() }],
      };
      cbs.onStateChange(s);

      await persistRoundtableState(s);

      cbs.onRoundComplete();
    } catch (e) {
      if (signal.aborted || isAbortError(e)) return;
      const msg = e instanceof Error ? e.message : "讨论中断，请重试。";
      setError(msg);
      cbs.onError(msg);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStreaming(false);
        setCurrentStep(null);
        setActiveTurn(null);
      }
    }
  }, []);

  const runSynthesis = useCallback(async (state: RoundtableState, cbs: OrchestratorCallbacks) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    setStreaming(true);
    setError(null);
    setCurrentStep("合成结案");
    setActiveTurn(buildModeratorActiveTurn("synthesis"));
    let s = { ...state };

    try {
      let synText = "";

      await consumeTurnStream(
        s,
        "synthesis",
        {},
        {
          onToken: (role, text, skillId) => cbs.onToken(role, text, skillId),
          onTurnComplete: () => {},
          onDispatch: () => {},
          onMemory: () => {},
          onSynthesis: (text) => {
            synText = text;
          },
          onError: (msg) => {
            throw new Error(msg);
          },
        },
        signal
      );

      if (signal.aborted) return;
      cbs.onTurnComplete();

      s = { ...s, phase: "done" as const, synthesis: synText };
      cbs.onStateChange(s);

      await persistRoundtableState(s);

      cbs.onRoundComplete();
    } catch (e) {
      if (signal.aborted || isAbortError(e)) return;
      const msg = e instanceof Error ? e.message : "合成中断，请重试。";
      setError(msg);
      cbs.onError(msg);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStreaming(false);
        setCurrentStep(null);
        setActiveTurn(null);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { streaming, currentStep, activeTurn, error, clearError, runRound, runSynthesis, cancelStream };
}
