"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoundtableReadiness } from "@/components/roundtable/use-roundtable-readiness";
import { useRoundtableOrchestrator } from "@/components/roundtable/use-roundtable-orchestrator";
import { useTokenBuffer } from "@/components/roundtable/use-token-buffer";
import { buildRoundtableMarkdown } from "@/lib/roundtable/export-markdown";
import { fetchResumedSession, fetchSharedSession } from "@/lib/roundtable/session-loaders";
import {
  buildEmptyState,
  buildSessionErrorState,
  clampMaxRounds,
  pickSelectedSkillIds,
  type SessionMode as RoundtableMode,
  type SkillOption as SkillOpt,
} from "@/lib/roundtable/session-state";
import type { RoundtableState } from "@/lib/spec/schema";
import { getSkillDisplay } from "@/lib/skills/skill-display";

export type { SkillOpt, RoundtableMode };

type UseRoundtableSessionOptions = {
  skills: SkillOpt[];
  initialTopic?: string;
  resumeSessionId?: string;
  fromShareToken?: string;
  initialSkillIds?: string[];
  initialMaxRounds?: number;
  defaultMode?: RoundtableMode;
  forcedMode?: RoundtableMode;
  defaultTopic?: string;
};

export function useRoundtableSession({
  skills,
  initialTopic,
  resumeSessionId,
  fromShareToken,
  initialSkillIds,
  initialMaxRounds,
  defaultMode = "discussion",
  forcedMode,
  defaultTopic = "人工智能是否会削弱人的主体性？",
}: UseRoundtableSessionOptions) {
  const { streaming, currentStep, activeTurn, error, clearError, runRound, runSynthesis, cancelStream } =
    useRoundtableOrchestrator();
  const { readiness, refetch, canStartRoundtable } = useRoundtableReadiness();
  const { live, pushToken, clearBuffer } = useTokenBuffer();

  const effectiveInitialMode = forcedMode ?? defaultMode;
  const [topic, setTopic] = useState(() => initialTopic?.trim() || defaultTopic);
  const [selected, setSelected] = useState<string[]>(() => {
    if (initialSkillIds?.length) {
      const valid = initialSkillIds.filter((id) => skills.some((s) => s.skillId === id));
      if (valid.length) return valid;
    }
    return [];
  });
  const [maxRounds, setMaxRounds] = useState(() => clampMaxRounds(initialMaxRounds));
  const [mode, setModeState] = useState<RoundtableMode>(effectiveInitialMode);
  const [userDraft, setUserDraft] = useState("");
  const [state, setState] = useState<RoundtableState | null>(null);

  const skillsRef = useRef(skills);
  const skillKey = useMemo(() => skills.map((k) => k.skillId).join("|"), [skills]);

  useEffect(() => {
    skillsRef.current = skills;
  }, [skills]);

  const applyModePolicy = useCallback(
    (s: RoundtableState): RoundtableState => (forcedMode ? { ...s, mode: forcedMode } : s),
    [forcedMode]
  );

  const hydrateImportedState = useCallback(
    (incoming: RoundtableState) => {
      const next = applyModePolicy(incoming);
      setState(next);
      setModeState(next.mode);
      setTopic(next.topic);
      setSelected(() => pickSelectedSkillIds(next.participantSkillIds, skillsRef.current));
      setMaxRounds(clampMaxRounds(next.maxRounds));
    },
    [applyModePolicy]
  );

  const resetStreamingState = useCallback(() => {
    cancelStream();
    clearBuffer();
  }, [cancelStream, clearBuffer]);

  const setMode = useCallback(
    (nextMode: RoundtableMode) => {
      setModeState(forcedMode ?? nextMode);
    },
    [forcedMode]
  );

  useEffect(
    () => () => {
      cancelStream();
    },
    [cancelStream]
  );

  useEffect(() => {
    if (!resumeSessionId?.trim()) return;
    let cancelled = false;
    void (async () => {
      resetStreamingState();
      const data = await fetchResumedSession(resumeSessionId);
      if (cancelled) return;
      if (!data.ok || !data.state) {
        setState(
          buildSessionErrorState(
            resumeSessionId,
            forcedMode ?? "discussion",
            "（未能载入旧席）",
            data.error ?? "请确认已登入且该席仍存在。"
          )
        );
        return;
      }
      const next = data.state.phase === "running" ? { ...data.state, phase: "idle" as const } : data.state;
      hydrateImportedState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [forcedMode, hydrateImportedState, resetStreamingState, resumeSessionId, skillKey]);

  useEffect(() => {
    if (!fromShareToken?.trim()) return;
    let cancelled = false;
    void (async () => {
      resetStreamingState();
      const data = await fetchSharedSession(fromShareToken);
      if (cancelled) return;
      if (!data.ok || !data.state) {
        setState(
          buildSessionErrorState(
            crypto.randomUUID(),
            forcedMode ?? "discussion",
            "（分享无效）",
            data.error ?? "链接已失效或格式不对。"
          )
        );
        return;
      }
      hydrateImportedState(data.state);
    })();
    return () => {
      cancelled = true;
    };
  }, [forcedMode, fromShareToken, hydrateImportedState, resetStreamingState, skillKey]);

  const buildCallbacks = useCallback(
    () => ({
      onStateChange: (s: RoundtableState) => setState(applyModePolicy(s)),
      onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => pushToken(role, text, skillId),
      onTurnComplete: () => clearBuffer(),
      onRoundComplete: () => {},
      onError: () => {},
    }),
    [applyModePolicy, pushToken, clearBuffer]
  );

  const toggle = useCallback(
    (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    []
  );

  const startFresh = useCallback(() => {
    if (!topic.trim() || selected.length === 0) return;
    const s = buildEmptyState(topic.trim(), selected, maxRounds, crypto.randomUUID(), forcedMode ?? mode);
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  }, [buildCallbacks, clearBuffer, forcedMode, maxRounds, mode, runRound, selected, topic]);

  const continueRound = useCallback(() => {
    if (!state) return;
    const s = applyModePolicy({ ...state, phase: "running", userCommand: undefined });
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  }, [applyModePolicy, buildCallbacks, clearBuffer, runRound, state]);

  const sealEnd = useCallback(() => {
    if (!state) return;
    const s = applyModePolicy({ ...state, userCommand: "stop", phase: "running" });
    setState(s);
    clearBuffer();
    void runSynthesis(s, buildCallbacks());
  }, [applyModePolicy, buildCallbacks, clearBuffer, runSynthesis, state]);

  const submitVoiceAndContinue = useCallback(() => {
    const text = userDraft.trim();
    if (!state || state.phase !== "await_user" || streaming) return;
    let next = state;
    if (text) {
      next = {
        ...state,
        transcript: [...state.transcript, { role: "user" as const, content: text, ts: new Date().toISOString() }],
      };
      setState(applyModePolicy(next));
      setUserDraft("");
    }
    const s = applyModePolicy({ ...next, phase: "running", userCommand: undefined });
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  }, [applyModePolicy, buildCallbacks, clearBuffer, runRound, state, streaming, userDraft]);

  const exportMd = useMemo(
    () => (state ? buildRoundtableMarkdown(state, (id) => (id ? getSkillDisplay(id).label : "列席")) : ""),
    [state]
  );
  const skillNameRecord = useMemo(() => Object.fromEntries(skills.map((s) => [s.skillId, s.name])), [skills]);
  const effectiveMode = forcedMode ?? mode;
  return {
    activeTurn,
    canStartRoundtable,
    clearError,
    continueRound,
    currentStep,
    error,
    exportMd,
    hasSession: !!state,
    live,
    maxRounds,
    mode: effectiveMode,
    readiness,
    refetch,
    sealEnd,
    selected,
    setMaxRounds,
    setMode,
    setSelectedDirectly: setSelected,
    setTopic,
    setUserDraft,
    skillNameRecord,
    startFresh,
    state,
    streaming,
    submitVoiceAndContinue,
    topic,
    toggle,
    userDraft,
  };
}
