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
import {
  checkpointForStep,
  createRoundCheckpoint,
  createSynthesisCheckpoint,
  markStateInterrupted,
  markStateRunning,
  STREAM_INTERRUPTED_MESSAGE,
} from "@/lib/roundtable/run-checkpoint";
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

async function publishProgress(state: RoundtableState, cbs: OrchestratorCallbacks) {
  cbs.onStateChange(state);
  await persistRoundtableState(state);
}

function defaultRoundSteps(state: RoundtableState): DispatchStep[] {
  return state.participantSkillIds.map((skillId) => ({ skillId }));
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

    const initialCheckpoint =
      state.runCheckpoint?.kind === "round" ? state.runCheckpoint : createRoundCheckpoint("moderator_open");
    let s = markStateRunning(state, initialCheckpoint);
    let completed = false;

    try {
      await publishProgress(s, cbs);

      if (s.runCheckpoint?.nextStep === "moderator_open") {
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

        const steps = s.mode === "debate" && dispatch ? dispatch : defaultRoundSteps(s);
        s = {
          ...s,
          transcript: [...s.transcript, { role: "moderator", content: modOpenText, ts: new Date().toISOString() }],
          runCheckpoint: checkpointForStep(steps, 0),
        };
        await publishProgress(s, cbs);
      }

      let steps = s.runCheckpoint?.steps ?? defaultRoundSteps(s);
      let stepIndex = s.runCheckpoint?.stepIndex ?? 0;

      while (s.runCheckpoint?.nextStep === "participant" || s.runCheckpoint?.nextStep === "moderator_judge") {
        if (signal.aborted) return;
        steps = s.runCheckpoint.steps ?? steps;
        stepIndex = s.runCheckpoint.stepIndex ?? stepIndex;
        const ps = steps[stepIndex];
        if (!ps) break;
        const isDebate = s.mode === "debate";

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

          const nextIndex = stepIndex + 1;
          s = {
            ...s,
            transcript: [...s.transcript, { role: "moderator", content: judgeText, ts: new Date().toISOString() }],
            runCheckpoint: checkpointForStep(steps, nextIndex),
          };
          await publishProgress(s, cbs);
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

        const nextIndex = stepIndex + 1;
        s = {
          ...s,
          transcript: [
            ...s.transcript,
            { role: "speaker" as const, skillId: ps.skillId, content: spokeText, ts: new Date().toISOString() },
          ],
          runCheckpoint: checkpointForStep(steps, nextIndex),
        };
        await publishProgress(s, cbs);
      }

      if (signal.aborted) return;
      if (s.runCheckpoint?.nextStep === "moderator_wrap") {
        setCurrentStep("主持整理");
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
          error: undefined,
          moderatorMemory: memory || s.moderatorMemory,
          transcript: [...s.transcript, { role: "moderator", content: wrapText, ts: new Date().toISOString() }],
          runCheckpoint: undefined,
        };
        await publishProgress(s, cbs);
      }

      completed = true;
      cbs.onRoundComplete();
    } catch (e) {
      if (signal.aborted || isAbortError(e)) return;
      const msg = e instanceof Error ? e.message : STREAM_INTERRUPTED_MESSAGE;
      const interrupted = markStateInterrupted(s, msg);
      s = interrupted;
      setError(msg);
      await publishProgress(interrupted, cbs);
      cbs.onError(msg);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStreaming(false);
        setCurrentStep(null);
        setActiveTurn(null);
      }
      if (!completed && signal.aborted) {
        void persistRoundtableState(s);
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
    setCurrentStep("整理结案");
    setActiveTurn(buildModeratorActiveTurn("synthesis"));
    let s = markStateRunning(
      state,
      state.runCheckpoint?.kind === "synthesis" ? state.runCheckpoint : createSynthesisCheckpoint()
    );

    try {
      await publishProgress(s, cbs);
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

      s = { ...s, phase: "done" as const, error: undefined, synthesis: synText, runCheckpoint: undefined };
      await publishProgress(s, cbs);

      cbs.onRoundComplete();
    } catch (e) {
      if (signal.aborted || isAbortError(e)) return;
      const msg = e instanceof Error ? e.message : STREAM_INTERRUPTED_MESSAGE;
      const interrupted = markStateInterrupted(s, msg);
      s = interrupted;
      setError(msg);
      await publishProgress(interrupted, cbs);
      cbs.onError(msg);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStreaming(false);
        setCurrentStep(null);
        setActiveTurn(null);
      }
      if (signal.aborted) {
        void persistRoundtableState(s);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { streaming, currentStep, activeTurn, error, clearError, runRound, runSynthesis, cancelStream };
}
