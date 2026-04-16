"use client";

import { useState } from "react";
import Link from "next/link";
import { FadeIn, InkReveal } from "@/components/motion-root";
import { RoundtableMainPanel } from "@/components/roundtable/roundtable-main-panel";
import { RoundtableReadinessBanner } from "@/components/roundtable/roundtable-readiness-banner";
import { RoundtableSidebar } from "@/components/roundtable/roundtable-sidebar";
import { useRoundtableSession, type SkillOpt } from "@/components/roundtable/use-roundtable-session";

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
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!session.topic.trim() || skills.length === 0 || recommendLoading) return;
    setRecommendLoading(true);
    setRecommendError(null);
    try {
      const res = await fetch("/api/roundtable/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: session.topic.trim(), availableSkillIds: skills.map((skill) => skill.skillId) }),
      });
      const data = (await res.json()) as { recommendedSkillIds?: string[]; error?: string };
      if (res.ok && data.recommendedSkillIds?.length) session.setSelectedDirectly(data.recommendedSkillIds);
      else setRecommendError(data.error ?? "推荐失败，请重试。");
    } catch {
      setRecommendError("网络错误，请重试。");
    } finally {
      setRecommendLoading(false);
    }
  };

  return (
    <FadeIn className="lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <InkReveal className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <RoundtableReadinessBanner readiness={session.readiness} />
        {skills.length === 0 ? (
          <div className="mb-4 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-ink-800 ring-destructive">
            讨论席名录尚未备好，无法点选视角。请待维护者处理后再来，或返回
            <Link href="/" className="text-cinnabar-700 underline">
              序页
            </Link>
            查看说明。
          </div>
        ) : null}
        <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
          <RoundtableSidebar
            skills={skills}
            topic={session.topic}
            selected={session.selected}
            maxRounds={session.maxRounds}
            mode={session.mode}
            streaming={session.streaming}
            recommendLoading={recommendLoading}
            recommendError={recommendError}
            currentStep={session.currentStep}
            error={session.error}
            canStartRoundtable={session.canStartRoundtable}
            hasSession={session.hasSession}
            exportMd={session.exportMd}
            state={session.state}
            skillNameRecord={session.skillNameRecord}
            onTopicChange={session.setTopic}
            onToggleSkill={session.toggle}
            onSetSelected={session.setSelectedDirectly}
            onRecommend={handleRecommend}
            onSetMaxRounds={session.setMaxRounds}
            onSetMode={session.setMode}
            onStart={session.startFresh}
            onSeal={session.sealEnd}
            onResume={() => {
              session.clearError();
              session.continueRound();
            }}
            onRefresh={() => {
              session.clearError();
              session.refetch();
            }}
          />
          <RoundtableMainPanel
            state={session.state}
            live={session.live}
            streaming={session.streaming}
            userDraft={session.userDraft}
            onUserDraftChange={session.setUserDraft}
            onContinue={session.continueRound}
            onSubmit={session.submitVoiceAndContinue}
            onSeal={session.sealEnd}
          />
        </div>
        {session.state ? (
          <p className="mt-3 text-xs text-ink-500">
            席位卡片现展示：立场标签、证据倾向、风格卡片；轮末附「共识 / 分歧 / 待证据补强」来源席位。
          </p>
        ) : null}
      </InkReveal>
    </FadeIn>
  );
}
