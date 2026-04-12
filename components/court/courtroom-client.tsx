"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { FadeIn, InkReveal } from "@/components/motion-root";
import { Button } from "@/components/ui/button";
import { CourtroomMusicToggle } from "@/components/court/courtroom-music-toggle";
import { CourtroomStage } from "@/components/court/courtroom-stage";
import { RoundtableReadinessBanner } from "@/components/roundtable/roundtable-readiness-banner";
import { ShareLinkControls } from "@/components/roundtable/share-link-controls";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import { useRoundtableSession, type SkillOpt } from "@/components/roundtable/use-roundtable-session";
import { triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import { cn } from "@/lib/utils";

const lightActionButtonClass =
  "rounded-xl border-ink-200/60 bg-card text-ink-800 hover:border-cinnabar-600/40 hover:bg-paper-50 active:scale-[0.99]";

const darkActionButtonClass =
  "rounded-xl border-paper-50/20 bg-paper-50/8 text-paper-50 hover:bg-paper-50/14 hover:text-paper-50 active:scale-[0.99]";

export function CourtroomClient({
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
  const session = useRoundtableSession({
    skills,
    initialTopic,
    resumeSessionId,
    fromShareToken,
    initialSkillIds,
    initialMaxRounds,
    forcedMode: "debate",
    defaultTopic: "当效率与人的尊严冲突时，制度应站在哪一边？",
  });

  const {
    activeTurn,
    canStartRoundtable,
    clearError,
    continueRound,
    currentStep,
    error,
    exportMd,
    hasSession,
    live,
    maxRounds,
    readiness,
    refetch,
    sealEnd,
    selected,
    setMaxRounds,
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
  } = session;

  return (
    <FadeIn>
      <InkReveal className="court-page space-y-5">
        <RoundtableReadinessBanner readiness={readiness} />

        {skills.length === 0 && (
          <div className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-ink-800 ring-destructive">
            讨论席名录尚未备好，无法升堂。请待维护者处理后再来，或返回
            <Link href="/" className="text-cinnabar-700 underline">
              序页
            </Link>
            查看说明。
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="rounded-2xl bg-card p-5 text-ink-800 card-elevated lg:sticky lg:top-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-xs tracking-[0.24em] text-ink-500">开庭设置</p>
                <h2 className="mt-2 max-w-none text-balance font-serif text-2xl leading-tight tracking-[0.08em] text-ink-900">
                  先定案由，再择列席
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-cinnabar-600/20 bg-cinnabar-600/8 px-3 py-1 text-xs text-cinnabar-700">
                <span>公堂模式</span>
                <span className="rounded-full border border-cinnabar-600/25 bg-cinnabar-600/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cinnabar-700">
                  Beta
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm leading-7 text-ink-600">
              题目写得越锋利，席上交锋越有力。先圈定争点，再挑几位真正彼此牵制的视角入庭。
            </p>

            <label className="mt-5 block text-sm text-ink-700">
              <span className="mb-1 block text-ink-900">案由</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-ink-200/60 bg-paper-50 px-3 py-2 text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
              />
            </label>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-900">列席</span>
                <span className="font-sans text-xs text-ink-500">已选 {selected.length} 位</span>
              </div>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl bg-paper-50/70 p-3 ring-border">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => {
                    const d = getSkillDisplay(s.skillId);
                    return (
                      <button
                        key={s.skillId}
                        type="button"
                        title={d.brief}
                        onClick={() => toggle(s.skillId)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 font-sans text-xs transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                          selected.includes(s.skillId)
                            ? "border-transparent ring-brand bg-cinnabar-600/10 text-cinnabar-700 hover:bg-cinnabar-600/15"
                            : "border-ink-200/70 bg-card text-ink-600 hover:border-cinnabar-600/40 hover:text-cinnabar-700"
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-ink-700">
                  庭数
                  <input
                    type="number"
                    min={1}
                    max={MAX_ROUND_ROUNDS}
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(Number(e.target.value))}
                    className="w-14 rounded-lg border border-ink-200/60 bg-paper-50 px-2 py-1 text-ink-900"
                  />
                </label>
                <CourtroomMusicToggle />
              </div>

              <div className="flex flex-wrap items-center gap-2 font-sans">
                <Button
                  type="button"
                  onClick={startFresh}
                  disabled={streaming || !canStartRoundtable || skills.length === 0 || selected.length === 0}
                  className="rounded-xl bg-cinnabar-600 text-card shadow-sm transition-[transform,box-shadow] duration-150 hover:bg-cinnabar-700 active:scale-[0.99] disabled:active:scale-100"
                >
                  升堂
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={sealEnd}
                  disabled={streaming || !hasSession || state?.phase === "done"}
                  className="rounded-xl border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10 active:scale-[0.99]"
                >
                  结案
                </Button>
              </div>
            </div>

            {state ? (
              <div className="mt-5 space-y-3 border-t border-ink-200/70 pt-4">
                <div className="flex flex-wrap items-center gap-2 font-sans">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("min-w-[96px]", lightActionButtonClass)}
                    onClick={() => navigator.clipboard.writeText(exportMd)}
                  >
                    抄录全文
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("min-w-[96px]", lightActionButtonClass)}
                    onClick={() => state && triggerMarkdownDownload(state.topic, exportMd)}
                  >
                    下载 MD
                  </Button>
                  <Link
                    href="/roundtable"
                    className="inline-flex h-7 min-w-[96px] items-center justify-center rounded-xl border border-ink-200/60 bg-card px-3 py-1 text-[0.8rem] text-ink-800 transition-[transform,border-color,background-color] hover:border-cinnabar-600/40 hover:bg-paper-50 active:scale-[0.99]"
                  >
                    回圆桌
                  </Link>
                  <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} inline />
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 pt-4 font-sans text-xs text-ink-600">
              <span className="flex items-center gap-2">
                {streaming ? <Loader2 className="size-3.5 animate-spin text-cinnabar-700" aria-hidden /> : null}
                {streaming ? currentStep || "堂上交锋中" : "原创像素法庭 · 辩论编排"}
              </span>
              {state ? (
                <span>
                  第 {state.round} / {state.maxRounds} 庭 · {phaseInWords(state.phase)}
                </span>
              ) : null}
            </div>
          </aside>

          <div className="space-y-5">
            <CourtroomStage
              transcript={state?.transcript ?? []}
              participantIds={state?.participantSkillIds ?? selected}
              skillTitle={(id) => getSkillDisplay(id).label}
              liveTokens={live}
              activeTurn={activeTurn}
              round={state?.round ?? 0}
              maxRounds={state?.maxRounds ?? maxRounds}
              phaseLabel={state ? phaseInWords(state.phase) : "待开庭"}
            />
          </div>
        </div>

        {state?.phase === "await_user" && !streaming && (
          <section className="rounded-2xl border border-gold-500/50 bg-ink-900/85 p-5 text-paper-50 card-dark-elevated">
            <h3 className="text-sm font-medium">席间陈词</h3>
            <p className="mt-1 text-xs text-paper-50/70">本庭已收束。写下补充、质疑或证据，再续下一庭。</p>
            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              rows={2}
              placeholder="写下你的追问或判断..."
              className="mt-2 w-full rounded-xl border border-paper-50/20 bg-paper-50/95 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-gold-500"
            />
            <div className="mt-2 flex flex-wrap gap-2 font-sans">
              <Button
                type="button"
                onClick={submitVoiceAndContinue}
                disabled={!userDraft.trim()}
                className="rounded-xl bg-cinnabar-600 text-paper-50 hover:bg-cinnabar-700"
              >
                呈上并续庭
              </Button>
              <Button type="button" variant="outline" onClick={continueRound} className={darkActionButtonClass}>
                直接续庭
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={sealEnd}
                className="rounded-xl border-gold-500/70 bg-gold-500/10 text-paper-50 hover:bg-gold-500/18 hover:text-paper-50 active:scale-[0.99]"
              >
                结案
              </Button>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-xl bg-destructive/5 p-3 ring-destructive" role="alert">
            <p className="text-sm text-cinnabar-800">{error}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {state && state.transcript.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    clearError();
                    continueRound();
                  }}
                  className="rounded-xl bg-cinnabar-600 text-card active:scale-[0.99]"
                >
                  从中断处续庭
                </Button>
              ) : null}
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

        {state?.synthesis ? <SynthesisDialog content={state.synthesis} /> : null}
      </InkReveal>
    </FadeIn>
  );
}
