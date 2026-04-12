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

        <section className="rounded-2xl bg-ink-900/85 p-5 text-paper-50 card-dark-elevated">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs tracking-[0.24em] text-gold-500">开庭设置</p>
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-paper-50/80">案由</span>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-paper-50/20 bg-paper-50/95 px-3 py-2 text-ink-900 outline-none focus:ring-2 focus:ring-gold-500"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 lg:w-[360px]">
              <div>
                <span className="font-sans text-xs text-paper-50/70">列席</span>
                <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
                  {skills.map((s) => {
                    const d = getSkillDisplay(s.skillId);
                    return (
                      <button
                        key={s.skillId}
                        type="button"
                        title={d.brief}
                        onClick={() => toggle(s.skillId)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 font-sans text-xs transition-[transform,border-color,background-color] active:scale-[0.97]",
                          selected.includes(s.skillId)
                            ? "border-gold-500 bg-gold-500/20 text-paper-50"
                            : "border-paper-50/20 bg-paper-50/5 text-paper-50/70 hover:border-gold-500/70"
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-sans text-sm">
                <label className="flex items-center gap-2 text-paper-50/80">
                  庭数
                  <input
                    type="number"
                    min={1}
                    max={MAX_ROUND_ROUNDS}
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(Number(e.target.value))}
                    className="w-14 rounded-lg border border-paper-50/20 bg-paper-50/95 px-2 py-1 text-ink-900"
                  />
                </label>
                <CourtroomMusicToggle />
                <Button
                  type="button"
                  onClick={startFresh}
                  disabled={streaming || !canStartRoundtable || skills.length === 0 || selected.length === 0}
                  className="rounded-xl bg-cinnabar-600 text-paper-50 hover:bg-cinnabar-700 active:scale-[0.99]"
                >
                  升堂
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={sealEnd}
                  disabled={streaming || !hasSession || state?.phase === "done"}
                  className="rounded-xl border-gold-500/70 bg-paper-50/5 text-paper-50 hover:bg-gold-500/20 hover:text-paper-50"
                >
                  结案
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-paper-50/15 pt-3 font-sans text-xs text-paper-50/75">
            <span className="flex items-center gap-2">
              {streaming ? <Loader2 className="size-3.5 animate-spin text-gold-500" aria-hidden /> : null}
              {streaming ? currentStep || "堂上交锋中" : "原创像素法庭 · 辩论编排"}
            </span>
            {state ? (
              <span>
                第 {state.round} / {state.maxRounds} 庭 · {phaseInWords(state.phase)}
              </span>
            ) : null}
          </div>
        </section>

        {state?.phase === "await_user" && !streaming && (
          <section className="rounded-2xl border border-gold-500/50 bg-ink-900/85 p-5 text-paper-50">
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
              <Button type="button" variant="outline" onClick={continueRound} className="rounded-xl">
                直接续庭
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={sealEnd}
                className="rounded-xl border-gold-500/70 bg-paper-50/5 text-paper-50 hover:bg-gold-500/20 hover:text-paper-50"
              >
                结案
              </Button>
            </div>
          </section>
        )}

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          {state ? (
            <div className="rounded-xl bg-card/80 p-3 ring-border">
              <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} />
            </div>
          ) : null}

          {state ? (
            <div className="flex flex-wrap items-center gap-2 font-sans">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => navigator.clipboard.writeText(exportMd)}
              >
                抄录全文
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => state && triggerMarkdownDownload(state.topic, exportMd)}
              >
                下载 MD
              </Button>
              <Link
                href="/roundtable"
                className="rounded-xl bg-card/80 px-3 py-1.5 text-sm text-ink-800 ring-border hover:shadow-[0_0_0_1px_var(--cinnabar)]"
              >
                回圆桌
              </Link>
            </div>
          ) : null}
        </div>

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
