"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { FadeIn, InkReveal } from "@/components/MotionRoot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SwimLanes } from "@/components/roundtable/SwimLanes";
import { RoundtableReadinessBanner } from "@/components/roundtable/RoundtableReadinessBanner";
import { useRoundtableReadiness } from "@/components/roundtable/use-roundtable-readiness";
import { useRoundtableStream } from "@/components/roundtable/use-roundtable-stream";
import type { RoundtableState, StreamEvent } from "@/lib/spec/schema";
import { ShareLinkControls } from "@/components/roundtable/ShareLinkControls";
import { cloneStateForFork } from "@/lib/roundtable/clone-for-fork";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import type { SharePayload } from "@/lib/spec/share-payload";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { phaseInWords } from "@/lib/roundtable/phase-label";

type SkillOpt = {
  skillId: string;
  name: string;
  description: string;
};

function emptyState(topic: string, ids: string[], maxRounds: number, sessionId: string): RoundtableState {
  return {
    sessionId,
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
  const { streaming, error, clearError, runStream } = useRoundtableStream();
  const { readiness, refetch, canStartRoundtable } = useRoundtableReadiness();
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
  const [userDraft, setUserDraft] = useState("");
  const [state, setState] = useState<RoundtableState | null>(null);
  const [live, setLive] = useState<{
    role: "moderator" | "speaker";
    skillId?: string;
    text: string;
  } | null>(null);
  const [eventsLog, setEventsLog] = useState<StreamEvent[]>([]);

  useEffect(() => {
    if (initialTopic?.trim()) setTopic(initialTopic.trim());
  }, [initialTopic]);

  useEffect(() => {
    if (initialMaxRounds) {
      setMaxRounds(Math.min(initialMaxRounds, MAX_ROUND_ROUNDS));
    }
  }, [initialMaxRounds]);

  const skillKey = useMemo(() => skills.map((k) => k.skillId).join("|"), [skills]);
  const skillsRef = useRef(skills);
  skillsRef.current = skills;

  useEffect(() => {
    if (!resumeSessionId?.trim()) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/roundtable/sessions/${resumeSessionId.trim()}`);
      const data = (await res.json()) as { state?: RoundtableState; error?: string };
      if (cancelled) return;
      if (!res.ok || !data.state) {
        setState({
          sessionId: resumeSessionId,
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
      if (s.phase === "running") {
        s = { ...s, phase: "idle" };
      }
      const curSkills = skillsRef.current;
      setState(s);
      setTopic(s.topic);
      setSelected((prevSel) => {
        const known = s.participantSkillIds.filter((id) => curSkills.some((k) => k.skillId === id));
        if (known.length > 0) return known;
        if (curSkills.length === 0) return prevSel;
        return curSkills.slice(0, Math.min(2, curSkills.length)).map((k) => k.skillId);
      });
      setMaxRounds(s.maxRounds);
      setEventsLog([]);
      setLive(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeSessionId, skillKey]);

  useEffect(() => {
    if (!fromShareToken?.trim()) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/roundtable/share/${fromShareToken.trim()}`);
      const data = (await res.json()) as { payload?: SharePayload; error?: string };
      if (cancelled) return;
      if (!res.ok || !data.payload) {
        setState({
          sessionId: crypto.randomUUID(),
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
      const curSkills = skillsRef.current;
      setState(s);
      setTopic(s.topic);
      setSelected((prevSel) => {
        const known = s.participantSkillIds.filter((id) => curSkills.some((k) => k.skillId === id));
        if (known.length > 0) return known;
        if (curSkills.length === 0) return prevSel;
        return curSkills.slice(0, Math.min(2, curSkills.length)).map((k) => k.skillId);
      });
      setMaxRounds(Math.min(s.maxRounds, MAX_ROUND_ROUNDS));
      setEventsLog([]);
      setLive(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [fromShareToken, skillKey]);

  const recoverFromStreamFailure = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.transcript.length === 0) return null;
      return { ...prev, phase: "error" };
    });
    setLive(null);
  }, []);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleEvent = useCallback((e: StreamEvent) => {
    setEventsLog((l) => [...l, e]);
    if (e.type === "token") {
      setLive((prev) => {
        if (prev && prev.role === e.role && prev.skillId === e.skillId) {
          return { ...prev, text: prev.text + e.text };
        }
        return { role: e.role, skillId: e.skillId, text: e.text };
      });
    }
    if (e.type === "turn_complete") {
      setLive(null);
    }
  }, []);

  const startFresh = () => {
    if (!topic.trim() || selected.length === 0) return;
    const s = emptyState(topic.trim(), selected, Math.min(maxRounds, MAX_ROUND_ROUNDS), crypto.randomUUID());
    setState(s);
    setEventsLog([]);
    setLive(null);
    void runStream(s, "graph", {
      onEvent: handleEvent,
      onDone: setState,
      onError: recoverFromStreamFailure,
    });
  };

  const continueRound = () => {
    if (!state) return;
    const s: RoundtableState = {
      ...state,
      phase: "running",
      userCommand: undefined,
    };
    setLive(null);
    void runStream(s, "graph", {
      onEvent: handleEvent,
      onDone: setState,
      onError: recoverFromStreamFailure,
    });
  };

  const sealEnd = () => {
    if (!state) return;
    const s: RoundtableState = {
      ...state,
      userCommand: "stop",
      phase: "running",
    };
    setLive(null);
    void runStream(s, "graph", {
      onEvent: handleEvent,
      onDone: setState,
      onError: recoverFromStreamFailure,
    });
  };

  const exportMd = useMemo(() => {
    if (!state) return "";
    return buildRoundtableMarkdown(state, (id) => skills.find((x) => x.skillId === id)?.name ?? "列席");
  }, [state, skills]);

  const skillNameRecord = useMemo(() => Object.fromEntries(skills.map((s) => [s.skillId, s.name])), [skills]);

  const appendMyVoice = () => {
    const text = userDraft.trim();
    if (!text || !state || state.phase !== "await_user" || streaming) return;
    setState({
      ...state,
      transcript: [...state.transcript, { role: "user", content: text, ts: new Date().toISOString() }],
    });
    setUserDraft("");
  };

  useEffect(() => {
    if (state?.phase === "done" && state.synthesis) {
      /* 钤印感：可扩展 toast */
    }
  }, [state]);

  return (
    <FadeIn>
      <InkReveal>
        <header className="mb-8 border-b border-ink-200/40 pb-6">
          <h1 className="font-serif text-2xl tracking-[0.2em] text-ink-900">圆桌</h1>
          <p className="mt-2 text-sm text-ink-700">
            每席列席是<strong className="text-ink-900">独立代理</strong>
            ，各加载一种视角（Skill）；主持另起一路，不代他们发言。轮末你可
            <strong className="text-ink-900">在席上插话</strong>
            ，再续下一轮让各席回应你。
          </p>
          <p className="mt-3 text-xs text-ink-600">
            正式使用请先
            <Link href="/login" className="text-cinnabar-700 underline">
              登入
            </Link>
            并在
            <Link href="/settings" className="text-cinnabar-700 underline">
              砚台
            </Link>
            钤印，以免开席后无墨可用。登入后的存档可在
            <Link href="/roundtable/jiuxi" className="mx-1 text-cinnabar-700 underline">
              旧席录
            </Link>
            查看。
          </p>
        </header>

        <RoundtableReadinessBanner readiness={readiness} />

        {skills.length === 0 && (
          <div className="mb-6 rounded-sm border border-cinnabar-600/40 bg-cinnabar-600/5 px-4 py-3 text-sm text-ink-800">
            讨论席名录尚未备好，无法点选视角。请待维护者处理后再来，或返回
            <Link href="/" className="text-cinnabar-700 underline">
              序页
            </Link>
            查看说明。
          </div>
        )}

        <section className="mb-8 space-y-4 rounded-sm border border-ink-200/40 bg-paper-100/30 p-4">
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
              {skills.map((s) => (
                <Button
                  key={s.skillId}
                  type="button"
                  variant="outline"
                  size="sm"
                  title={s.description || s.name}
                  onClick={() => toggle(s.skillId)}
                  className={cn(
                    "font-sans transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                    selected.includes(s.skillId) &&
                      "border-cinnabar-600 bg-cinnabar-600/10 text-cinnabar-800 hover:bg-cinnabar-600/15"
                  )}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-ink-700">
              最多几轮
              <input
                type="number"
                min={1}
                max={MAX_ROUND_ROUNDS}
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="w-16 border border-ink-200/60 bg-paper-50 px-2 py-1"
              />
            </label>
          </div>
          {streaming && (
            <p className="mb-2 flex items-center gap-2 font-sans text-sm text-ink-600" aria-live="polite">
              <Loader2 className="size-4 shrink-0 animate-spin text-cinnabar-700" aria-hidden />
              执笔流转中，请稍候…
            </p>
          )}
          <div className="flex flex-wrap gap-3 font-sans">
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
              onClick={continueRound}
              disabled={streaming || !state || state.phase !== "await_user"}
              className="transition-[transform,border-color] duration-150 active:scale-[0.99]"
            >
              再续一轮
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={sealEnd}
              disabled={streaming || !state || state.phase === "done"}
              className="border-cinnabar-600/60 text-cinnabar-800 transition-[transform] duration-150 hover:bg-cinnabar-600/10 active:scale-[0.99]"
            >
              钤印结案
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(exportMd)}
              disabled={!state}
              className="transition-[transform] duration-150 active:scale-[0.99]"
            >
              抄录全文
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => state && triggerMarkdownDownload(state.topic, exportMd)}
              disabled={!state}
              className="transition-[transform] duration-150 active:scale-[0.99]"
            >
              下载 Markdown
            </Button>
          </div>
          {state && (
            <div className="rounded-sm border border-ink-200/30 bg-paper-50/50 p-3">
              <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} />
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-cinnabar-600/30 bg-cinnabar-600/5 p-3" role="alert">
              <p className="text-sm text-cinnabar-800">{error}</p>
              <p className="mt-2 text-xs text-ink-600">
                若你刚完成登入或砚台钤印，可先
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mx-1 h-auto p-0 text-cinnabar-700"
                  onClick={() => {
                    clearError();
                    refetch();
                  }}
                >
                  刷新就绪状态
                </Button>
                再点「开席」。若提示需登入或钤印，请按横幅指引操作。
              </p>
            </div>
          )}
        </section>

        {state && (
          <div className="mb-4 text-sm text-ink-700">
            第 {state.round} / {state.maxRounds} 轮 · 此刻{" "}
            <span className="text-cinnabar-700">{phaseInWords(state.phase)}</span>
            {state.moderatorMemory && (
              <p className="mt-2 border-l-2 border-gold-500 pl-3 text-xs text-ink-600">
                主持手记：{state.moderatorMemory}
              </p>
            )}
          </div>
        )}

        {state?.phase === "await_user" && !streaming && (
          <section className="mb-6 rounded-sm border border-gold-500/40 bg-paper-100/50 p-4">
            <h3 className="text-sm font-medium text-ink-900">席上插话</h3>
            <p className="mt-1 text-xs text-ink-600">
              本轮主持已收束。你可写下自己的观点；记入后出现在「席上（你）」泳道，再点「再续一轮」时各列席代理会读到并回应。
            </p>
            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              rows={3}
              placeholder="写你想补充的判断、质疑或例子…"
              className="mt-3 w-full border border-ink-200/60 bg-paper-50 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
            />
            <Button
              type="button"
              onClick={appendMyVoice}
              disabled={!userDraft.trim()}
              className="mt-2 bg-ink-900 text-primary-foreground transition-[transform] duration-150 active:scale-[0.99]"
            >
              记入席上
            </Button>
          </section>
        )}

        {state && (
          <SwimLanes
            transcript={state.transcript}
            participantIds={state.participantSkillIds}
            skillTitle={(id) => skills.find((s) => s.skillId === id)?.name ?? "列席"}
            liveTokens={live}
          />
        )}

        {state?.synthesis && (
          <section className="mt-8 scroll-paper border border-cinnabar-600/30 bg-paper-100/50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-cinnabar-700">结案提要</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{state.synthesis}</div>
          </section>
        )}

        {process.env.NODE_ENV === "development" && eventsLog.length > 0 && (
          <details className="mt-8 text-xs text-ink-600">
            <summary>内部记录（仅本地可见）</summary>
            <pre className="mt-2 max-h-48 overflow-auto">{JSON.stringify(eventsLog.slice(-12), null, 2)}</pre>
          </details>
        )}
      </InkReveal>
    </FadeIn>
  );
}
