"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { FadeIn, InkReveal } from "@/components/motion-root";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Timeline } from "@/components/roundtable/timeline";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import { RoundtableReadinessBanner } from "@/components/roundtable/roundtable-readiness-banner";
import { useRoundtableSession, type SkillOpt } from "@/components/roundtable/use-roundtable-session";
import { ShareLinkControls } from "@/components/roundtable/share-link-controls";
import { triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import { getSkillDisplay } from "@/lib/skills/skill-display";

const CATEGORY_ORDER = ["军事战略", "政治治国", "哲学思想", "商业投资", "科技理工", "谋略纵横", "其他"];

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
  const session = useRoundtableSession({
    skills,
    initialTopic,
    resumeSessionId,
    fromShareToken,
    initialSkillIds,
    initialMaxRounds,
  });
  const [memoryOpen, setMemoryOpen] = useState(false);
  const {
    canStartRoundtable,
    clearError,
    continueRound,
    currentStep,
    error,
    exportMd,
    hasSession,
    live,
    maxRounds,
    mode,
    readiness,
    refetch,
    sealEnd,
    selected,
    setMaxRounds,
    setMode,
    setSelectedDirectly,
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
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set([CATEGORY_ORDER[0]]));
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  const groupedSkills = useMemo(() => {
    const groups: Record<string, typeof skills> = {};
    for (const s of skills) {
      const cat = s.category || "其他";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return groups;
  }, [skills]);

  const orderedCategories = useMemo(() => CATEGORY_ORDER.filter((c) => groupedSkills[c]?.length > 0), [groupedSkills]);

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const handleRecommend = async () => {
    if (!topic.trim() || skills.length === 0) return;
    if (recommendLoading) return;
    setRecommendLoading(true);
    setRecommendError(null);
    try {
      const res = await fetch("/api/roundtable/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), availableSkillIds: skills.map((s) => s.skillId) }),
      });
      const data = (await res.json()) as { recommendedSkillIds?: string[]; error?: string };
      if (res.ok && data.recommendedSkillIds && data.recommendedSkillIds.length > 0) {
        setSelectedDirectly(data.recommendedSkillIds);
      } else {
        setRecommendError(data.error ?? "推荐失败，请重试。");
      }
    } catch {
      setRecommendError("网络错误，请重试。");
    } finally {
      setRecommendLoading(false);
    }
  };

  return (
    <FadeIn className="lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <InkReveal className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
        <RoundtableReadinessBanner readiness={readiness} />

        {skills.length === 0 && (
          <div className="mb-4 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-ink-800 ring-destructive">
            讨论席名录尚未备好，无法点选视角。请待维护者处理后再来，或返回
            <Link href="/" className="text-cinnabar-700 underline">
              序页
            </Link>
            查看说明。
          </div>
        )}

        <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:overflow-hidden">
          {/* ── 左栏：设置 ── */}
          <aside className="space-y-4 rounded-2xl bg-card p-5 card-elevated lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
            <label className="block text-sm text-ink-700">
              <span className="mb-1 block text-ink-900">今日所议</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-ink-200/60 bg-paper-50 px-3 py-2 text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
              />
            </label>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900">请哪些视角入席</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={streaming || recommendLoading || !topic.trim() || skills.length === 0}
                  onClick={handleRecommend}
                  className="font-sans text-xs"
                >
                  {recommendLoading ? <Loader2 className="size-3 animate-spin" /> : "智能推荐"}
                </Button>
              </div>
              {recommendError && <p className="mt-1 text-xs text-cinnabar-700">{recommendError}</p>}
              <div className="mt-2 space-y-1">
                {orderedCategories.map((cat) => {
                  const isOpen = openCategories.has(cat);
                  const catSkills = groupedSkills[cat] ?? [];
                  const selectedCount = catSkills.filter((s) => selected.includes(s.skillId)).length;
                  return (
                    <div key={cat} className="rounded-lg ring-border">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-ink-700 hover:bg-ink-50"
                      >
                        <span className="flex items-center gap-1">
                          {isOpen ? (
                            <ChevronDown className="size-3 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3 shrink-0" />
                          )}
                          {cat}
                        </span>
                        <span className="text-ink-400">
                          {selectedCount > 0 ? `已选 ${selectedCount} / ` : ""}共 {catSkills.length}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="flex flex-wrap gap-1.5 px-2 py-2 divider-t">
                          {catSkills.map((s) => {
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
                                  "rounded-lg font-sans text-xs transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                                  selected.includes(s.skillId) &&
                                    "border-transparent ring-brand bg-cinnabar-600/10 text-cinnabar-600 hover:bg-cinnabar-600/15"
                                )}
                              >
                                {d.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
              <div className="flex items-center gap-0.5 rounded-xl p-0.5 ring-border">
                {(["discussion", "debate"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs transition-colors",
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
                className="rounded-xl bg-cinnabar-600 text-card shadow-sm transition-[transform,box-shadow] duration-150 hover:bg-cinnabar-700 active:scale-[0.99] disabled:active:scale-100"
              >
                开席
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sealEnd}
                disabled={streaming || !hasSession || state?.phase === "done"}
                className="rounded-xl border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10 active:scale-[0.99]"
              >
                钤印结案
              </Button>
              {state && (
                <>
                  <span className="mx-0.5 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(exportMd)}
                    className="rounded-xl active:scale-[0.99]"
                  >
                    抄录全文
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => state && triggerMarkdownDownload(state.topic, exportMd)}
                    className="rounded-xl active:scale-[0.99]"
                  >
                    下载 MD
                  </Button>
                </>
              )}
            </div>

            {state && (
              <div className="rounded-xl bg-card p-3 ring-border">
                <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-destructive/5 p-3 ring-destructive" role="alert">
                <p className="text-sm text-cinnabar-800">{error}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state && state.transcript.length > 0 && (
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
          <div className="mt-6 min-w-0 space-y-4 lg:mt-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-3 lg:overflow-hidden">
            {/* 状态栏 */}
            {state && (
              <div className="space-y-1 text-sm text-ink-700 lg:shrink-0">
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
                  <div className="rounded-xl bg-card p-3 text-xs text-ink-600 ring-border">{state.moderatorMemory}</div>
                )}
              </div>
            )}

            {/* 时间线 */}
            <div className="lg:min-h-0 lg:flex-1">
              {state ? (
                <Timeline
                  transcript={state.transcript}
                  participantIds={state.participantSkillIds}
                  skillTitle={(id) => getSkillDisplay(id).label}
                  liveTokens={live}
                  round={state.round}
                  maxRounds={state.maxRounds}
                  className="lg:h-full lg:overflow-y-auto lg:pr-2 lg:overscroll-contain"
                />
              ) : (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-600 lg:h-full lg:min-h-[400px]">
                  选好议题与列席，点「开席」即可开始。
                </div>
              )}
            </div>

            {/* 席间插话 */}
            {state?.phase === "await_user" && !streaming && (
              <section className="rounded-2xl bg-card p-4 ring-ring lg:shrink-0">
                <h3 className="text-sm font-medium text-ink-900">席间插话</h3>
                <p className="mt-1 text-xs text-ink-600">本轮已收束。写下观点后「记入并续轮」，或直接续轮跳过。</p>
                <textarea
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  rows={2}
                  placeholder="写你想补充的判断、质疑或例子…"
                  className="mt-2 w-full rounded-xl border border-ink-200/60 bg-paper-50 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
                />
                <div className="mt-2 flex flex-wrap gap-2 font-sans">
                  <Button
                    type="button"
                    onClick={submitVoiceAndContinue}
                    disabled={!userDraft.trim()}
                    className="rounded-xl bg-cinnabar-600 text-card hover:bg-cinnabar-700 active:scale-[0.99]"
                  >
                    记入并续轮
                  </Button>
                  <Button type="button" variant="outline" onClick={continueRound} className="rounded-xl">
                    直接续轮
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sealEnd}
                    className="rounded-xl border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10"
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
