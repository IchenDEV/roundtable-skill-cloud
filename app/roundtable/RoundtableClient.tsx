"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { FadeIn, InkReveal } from "@/components/MotionRoot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Timeline } from "@/components/roundtable/Timeline";
import { SynthesisDialog } from "@/components/roundtable/SynthesisDialog";
import { RoundtableReadinessBanner } from "@/components/roundtable/RoundtableReadinessBanner";
import { useRoundtableReadiness } from "@/components/roundtable/use-roundtable-readiness";
import { useRoundtableOrchestrator } from "@/components/roundtable/use-roundtable-orchestrator";
import { useTokenBuffer } from "@/components/roundtable/use-token-buffer";
import type { RoundtableState } from "@/lib/spec/schema";
import { ShareLinkControls } from "@/components/roundtable/ShareLinkControls";
import { cloneStateForFork } from "@/lib/roundtable/clone-for-fork";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import type { SharePayload } from "@/lib/spec/share-payload";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import { getSkillDisplay } from "@/lib/skills/skill-display";

type SkillOpt = { skillId: string; name: string; description: string };
type RoundtableMode = "discussion" | "debate";

function emptyState(
  topic: string,
  ids: string[],
  maxRounds: number,
  sessionId: string,
  mode: RoundtableMode
): RoundtableState {
  return {
    sessionId,
    mode,
    topic,
    round: 0,
    maxRounds,
    phase: "running",
    participantSkillIds: ids,
    transcript: [],
    moderatorMemory: "",
  };
}

export function RoundtableClient({
  skills,
  initialTopic,
  resumeSessionId,
  fromShareToken,
  initialSkillIds,
  initialMaxRounds,
}: {
  skills: SkillOpt[];
  initialTopic?: string;
  resumeSessionId?: string;
  fromShareToken?: string;
  initialSkillIds?: string[];
  initialMaxRounds?: number;
}) {
  const { streaming, currentStep, error, clearError, runRound, runSynthesis, cancelStream } =
    useRoundtableOrchestrator();
  const { readiness, refetch, canStartRoundtable } = useRoundtableReadiness();
  const { live, pushToken, clearBuffer } = useTokenBuffer();

  const [topic, setTopic] = useState(() => initialTopic?.trim() || "人工智能是否会削弱人的主体性？");
  const [selected, setSelected] = useState<string[]>(() => {
    if (initialSkillIds?.length) {
      const valid = initialSkillIds.filter((id) => skills.some((s) => s.skillId === id));
      if (valid.length) return valid;
    }
    return skills.slice(0, 2).map((s) => s.skillId);
  });
  const [maxRounds, setMaxRounds] = useState(() =>
    initialMaxRounds ? Math.min(initialMaxRounds, MAX_ROUND_ROUNDS) : 3
  );
  const [mode, setMode] = useState<RoundtableMode>("discussion");
  const [userDraft, setUserDraft] = useState("");
  const [state, setState] = useState<RoundtableState | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const skillsRef = useRef(skills);
  skillsRef.current = skills;
  const skillKey = useMemo(() => skills.map((k) => k.skillId).join("|"), [skills]);

  useEffect(() => {
    if (initialTopic?.trim()) setTopic(initialTopic.trim());
  }, [initialTopic]);

  useEffect(() => {
    if (initialMaxRounds) setMaxRounds(Math.min(initialMaxRounds, MAX_ROUND_ROUNDS));
  }, [initialMaxRounds]);

  useEffect(
    () => () => {
      cancelStream();
    },
    [cancelStream]
  );

  // ── Resume session ──
  useEffect(() => {
    if (!resumeSessionId?.trim()) return;
    let cancelled = false;
    void (async () => {
      cancelStream();
      clearBuffer();
      const res = await fetch(`/api/roundtable/sessions/${resumeSessionId.trim()}`);
      const data = (await res.json()) as { state?: RoundtableState; error?: string };
      if (cancelled) return;
      if (!res.ok || !data.state) {
        setState({
          sessionId: resumeSessionId,
          mode: "discussion",
          topic: "（未能载入旧席）",
          round: 0,
          maxRounds: 3,
          phase: "error",
          participantSkillIds: [],
          transcript: [],
          moderatorMemory: "",
          error: data.error ?? "请确认已登入且该席仍存在。",
        });
        return;
      }
      let s = data.state;
      if (s.phase === "running") s = { ...s, phase: "idle" };
      setState(s);
      setMode(s.mode);
      setTopic(s.topic);
      const curSkills = skillsRef.current;
      setSelected(() => {
        const known = s.participantSkillIds.filter((id) => curSkills.some((k) => k.skillId === id));
        return known.length > 0 ? known : curSkills.slice(0, 2).map((k) => k.skillId);
      });
      setMaxRounds(s.maxRounds);
    })();
    return () => {
      cancelled = true;
    };
  }, [cancelStream, clearBuffer, resumeSessionId, skillKey]);

  // ── From share ──
  useEffect(() => {
    if (!fromShareToken?.trim()) return;
    let cancelled = false;
    void (async () => {
      cancelStream();
      clearBuffer();
      const res = await fetch(`/api/roundtable/share/${fromShareToken.trim()}`);
      const data = (await res.json()) as { payload?: SharePayload; error?: string };
      if (cancelled) return;
      if (!res.ok || !data.payload) {
        setState({
          sessionId: crypto.randomUUID(),
          mode: "discussion",
          topic: "（分享无效）",
          round: 0,
          maxRounds: 3,
          phase: "error",
          participantSkillIds: [],
          transcript: [],
          moderatorMemory: "",
          error: data.error ?? "链接已失效或格式不对。",
        });
        return;
      }
      const s = cloneStateForFork(data.payload.state);
      setState(s);
      setMode(s.mode);
      setTopic(s.topic);
      const curSkills = skillsRef.current;
      setSelected(() => {
        const known = s.participantSkillIds.filter((id) => curSkills.some((k) => k.skillId === id));
        return known.length > 0 ? known : curSkills.slice(0, 2).map((k) => k.skillId);
      });
      setMaxRounds(Math.min(s.maxRounds, MAX_ROUND_ROUNDS));
    })();
    return () => {
      cancelled = true;
    };
  }, [cancelStream, clearBuffer, fromShareToken, skillKey]);

  // ── Orchestrator callbacks ──
  const buildCallbacks = useCallback(
    () => ({
      onStateChange: (s: RoundtableState) => setState(s),
      onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => pushToken(role, text, skillId),
      onTurnComplete: () => clearBuffer(),
      onRoundComplete: () => {},
      onError: () => {},
    }),
    [pushToken, clearBuffer]
  );

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const startFresh = () => {
    if (!topic.trim() || selected.length === 0) return;
    const s = emptyState(topic.trim(), selected, Math.min(maxRounds, MAX_ROUND_ROUNDS), crypto.randomUUID(), mode);
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  };

  const continueRound = () => {
    if (!state) return;
    const s: RoundtableState = { ...state, phase: "running", userCommand: undefined };
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  };

  const sealEnd = () => {
    if (!state) return;
    const s: RoundtableState = { ...state, userCommand: "stop", phase: "running" };
    setState(s);
    clearBuffer();
    void runSynthesis(s, buildCallbacks());
  };

  const submitVoiceAndContinue = () => {
    const text = userDraft.trim();
    if (!state || state.phase !== "await_user" || streaming) return;
    let next = state;
    if (text) {
      next = {
        ...state,
        transcript: [...state.transcript, { role: "user" as const, content: text, ts: new Date().toISOString() }],
      };
      setState(next);
      setUserDraft("");
    }
    const s: RoundtableState = { ...next, phase: "running", userCommand: undefined };
    setState(s);
    clearBuffer();
    void runRound(s, buildCallbacks());
  };

  const exportMd = useMemo(
    () => (state ? buildRoundtableMarkdown(state, (id) => (id ? getSkillDisplay(id).label : "列席")) : ""),
    [state]
  );
  const skillNameRecord = useMemo(() => Object.fromEntries(skills.map((s) => [s.skillId, s.name])), [skills]);

  const hasSession = !!state;

  return (
    <FadeIn>
      <InkReveal>
        <RoundtableReadinessBanner readiness={readiness} />

        {skills.length === 0 && (
          <div className="mb-4 rounded-sm border border-cinnabar-600/40 bg-cinnabar-600/5 px-4 py-3 text-sm text-ink-800">
            讨论席名录尚未备好，无法点选视角。请待维护者处理后再来，或返回
            <Link href="/" className="text-cinnabar-700 underline">
              序页
            </Link>
            查看说明。
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6">
          {/* ── 左栏：设置 ── */}
          <aside className="space-y-4 rounded-sm border border-ink-200/40 bg-paper-100/30 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
            <label className="block text-sm text-ink-700">
              <span className="mb-1 block text-ink-900">今日所议</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                className="w-full border border-ink-200/60 bg-paper-50 px-3 py-2 text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
              />
            </label>
            <div>
              <span className="text-sm text-ink-900">请哪些视角入席</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => {
                  const d = getSkillDisplay(s.skillId);
                  return (
                    <Button
                      key={s.skillId}
                      type="button"
                      variant="outline"
                      size="sm"
                      title={d.brief}
                      onClick={() => toggle(s.skillId)}
                      className={cn(
                        "font-sans transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                        selected.includes(s.skillId) &&
                          "border-cinnabar-600 bg-cinnabar-600/10 text-cinnabar-800 hover:bg-cinnabar-600/15"
                      )}
                    >
                      {d.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-ink-700">
                最多几轮
                <input
                  type="number"
                  min={1}
                  max={MAX_ROUND_ROUNDS}
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="w-14 border border-ink-200/60 bg-paper-50 px-2 py-1"
                />
              </label>
              <div className="flex items-center gap-0.5 rounded-sm border border-ink-200/60 p-0.5">
                {(["discussion", "debate"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-sm px-3 py-1 text-xs transition-colors",
                      mode === m ? "bg-ink-900 text-paper-50" : "text-ink-600 hover:bg-ink-100"
                    )}
                  >
                    {m === "discussion" ? "讨论" : "辩论"}
                  </button>
                ))}
              </div>
            </div>

            {streaming && (
              <p className="flex items-center gap-2 font-sans text-sm text-ink-600" aria-live="polite">
                <Loader2 className="size-4 shrink-0 animate-spin text-cinnabar-700" aria-hidden />
                {currentStep || "执笔流转中…"}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 font-sans">
              <Button
                type="button"
                onClick={startFresh}
                disabled={streaming || !canStartRoundtable || skills.length === 0 || selected.length === 0}
                className="bg-ink-900 text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-150 hover:bg-ink-800 active:scale-[0.99] disabled:active:scale-100"
              >
                开席
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sealEnd}
                disabled={streaming || !hasSession || state?.phase === "done"}
                className="border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10 active:scale-[0.99]"
              >
                钤印结案
              </Button>
              {hasSession && (
                <>
                  <span className="mx-0.5 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(exportMd)}
                    className="active:scale-[0.99]"
                  >
                    抄录全文
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => state && triggerMarkdownDownload(state.topic, exportMd)}
                    className="active:scale-[0.99]"
                  >
                    下载 MD
                  </Button>
                </>
              )}
            </div>

            {hasSession && (
              <div className="rounded-sm border border-ink-200/30 bg-paper-50/50 p-3">
                <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} />
              </div>
            )}

            {error && (
              <div className="rounded-sm border border-cinnabar-600/30 bg-cinnabar-600/5 p-3" role="alert">
                <p className="text-sm text-cinnabar-800">{error}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hasSession && state.transcript.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        clearError();
                        continueRound();
                      }}
                      className="bg-ink-900 text-primary-foreground active:scale-[0.99]"
                    >
                      从中断处续轮
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-cinnabar-700"
                    onClick={() => {
                      clearError();
                      refetch();
                    }}
                  >
                    刷新就绪状态
                  </Button>
                </div>
              </div>
            )}
          </aside>

          {/* ── 右栏：对话 ── */}
          <div className="mt-6 min-w-0 space-y-4 lg:mt-0">
            {/* 状态栏 */}
            {hasSession && (
              <div className="space-y-1 text-sm text-ink-700">
                <div className="flex items-center gap-2">
                  <span>
                    第 {state.round} / {state.maxRounds} 轮 · 此刻{" "}
                    <span className="text-cinnabar-700">{phaseInWords(state.phase)}</span>
                  </span>
                </div>
                {state.moderatorMemory && (
                  <button
                    type="button"
                    onClick={() => setMemoryOpen(!memoryOpen)}
                    className="flex items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-700"
                  >
                    {memoryOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    主持手记
                  </button>
                )}
                {memoryOpen && state.moderatorMemory && (
                  <div className="rounded-sm border border-gold-500/30 bg-paper-100/50 p-3 text-xs text-ink-600">
                    {state.moderatorMemory}
                  </div>
                )}
              </div>
            )}

            {/* 时间线 */}
            {hasSession ? (
              <Timeline
                transcript={state.transcript}
                participantIds={state.participantSkillIds}
                skillTitle={(id) => getSkillDisplay(id).label}
                liveTokens={live}
                round={state.round}
                maxRounds={state.maxRounds}
              />
            ) : (
              <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-600 lg:min-h-[400px]">
                选好议题与列席，点「开席」即可开始。
              </div>
            )}

            {/* 席间插话 */}
            {state?.phase === "await_user" && !streaming && (
              <section className="rounded-sm border border-gold-500/40 bg-paper-100/50 p-4">
                <h3 className="text-sm font-medium text-ink-900">席间插话</h3>
                <p className="mt-1 text-xs text-ink-600">本轮已收束。写下观点后「记入并续轮」，或直接续轮跳过。</p>
                <textarea
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  rows={2}
                  placeholder="写你想补充的判断、质疑或例子…"
                  className="mt-2 w-full border border-ink-200/60 bg-paper-50 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
                />
                <div className="mt-2 flex flex-wrap gap-2 font-sans">
                  <Button
                    type="button"
                    onClick={submitVoiceAndContinue}
                    disabled={!userDraft.trim()}
                    className="bg-ink-900 text-primary-foreground active:scale-[0.99]"
                  >
                    记入并续轮
                  </Button>
                  <Button type="button" variant="outline" onClick={continueRound}>
                    直接续轮
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sealEnd}
                    className="border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10"
                  >
                    钤印结案
                  </Button>
                </div>
              </section>
            )}

            {/* 结案提要 */}
            {state?.synthesis && <SynthesisDialog content={state.synthesis} />}
          </div>
        </div>
      </InkReveal>
    </FadeIn>
  );
}
