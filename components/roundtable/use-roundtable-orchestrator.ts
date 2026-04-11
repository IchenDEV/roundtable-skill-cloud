"use client";

import { useCallback, useRef, useState } from "react";
import type { RoundtableState, TurnResponseEvent, TurnStep } from "@/lib/spec/schema";

type DispatchStep = { skillId: string; target?: string; directive?: string };

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException) return err.name === "AbortError";
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /abort/i.test(err.message);
}

/** Read a single-turn SSE stream and call handlers for each event */
async function consumeTurnStream(
  state: RoundtableState,
  step: TurnStep,
  opts: { skillId?: string; target?: string; directive?: string },
  handlers: {
    onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => void;
    onTurnComplete: (role: "moderator" | "speaker", fullText: string, skillId?: string) => void;
    onDispatch: (steps: DispatchStep[]) => void;
    onMemory: (text: string) => void;
    onSynthesis: (text: string) => void;
    onError: (msg: string) => void;
  },
  signal: AbortSignal
): Promise<void> {
  const res = await fetch("/api/roundtable/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, step, ...opts }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = "暂时无法开始，请稍后再试。";
    try {
      const j = JSON.parse(t) as { error?: unknown };
      if (typeof j.error === "string") msg = j.error;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("连接未能建立，请重试。");
  const dec = new TextDecoder();
  let carry = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal.aborted) return;
    carry += dec.decode(value, { stream: true });
    const parts = carry.split("\n\n");
    carry = parts.pop() ?? "";
    for (const block of parts) {
      const line = block.trim();
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      try {
        const ev = JSON.parse(raw) as TurnResponseEvent;
        switch (ev.type) {
          case "token":
            handlers.onToken(ev.role, ev.text, ev.skillId);
            break;
          case "turn_complete":
            handlers.onTurnComplete(ev.role, ev.fullText, ev.skillId);
            break;
          case "dispatch":
            handlers.onDispatch(ev.steps);
            break;
          case "memory":
            handlers.onMemory(ev.text);
            break;
          case "synthesis_complete":
            handlers.onSynthesis(ev.text);
            break;
          case "error":
            handlers.onError(ev.message);
            return;
          case "done":
            return;
        }
      } catch {
        /* skip malformed SSE */
      }
    }
  }
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
  const controllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStreaming(false);
    setCurrentStep(null);
  }, []);

  /** Run a full round: moderator_open → each participant → moderator_wrap */
  const runRound = useCallback(async (state: RoundtableState, cbs: OrchestratorCallbacks) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    setStreaming(true);
    setError(null);
    let s = { ...state };

    try {
      // ── Step 1: Moderator Open ──
      setCurrentStep("主持开场");
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

      // ── Step 2: Participants ──
      const isDebate = s.mode === "debate";
      const participantSteps: { skillId: string; target?: string; directive?: string }[] =
        isDebate && dispatch ? dispatch : s.participantSkillIds.map((skillId) => ({ skillId }));

      for (const ps of participantSteps) {
        if (signal.aborted) return;
        setCurrentStep(ps.skillId);
        let spokeText = "";

        await consumeTurnStream(
          s,
          "participant",
          ps,
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

      // ── Step 3: Moderator Wrap ──
      if (signal.aborted) return;
      setCurrentStep("主持收束");
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

      // ── Persist ──
      try {
        await fetch("/api/roundtable/persist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: s }),
        });
      } catch {
        /* persist failure is non-fatal */
      }

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
      }
    }
  }, []);

  /** Run synthesis (stop/seal) */
  const runSynthesis = useCallback(async (state: RoundtableState, cbs: OrchestratorCallbacks) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    setStreaming(true);
    setError(null);
    setCurrentStep("合成结案");
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

      // Persist
      try {
        await fetch("/api/roundtable/persist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: s }),
        });
      } catch {
        /* non-fatal */
      }

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
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { streaming, currentStep, error, clearError, runRound, runSynthesis, cancelStream };
}
