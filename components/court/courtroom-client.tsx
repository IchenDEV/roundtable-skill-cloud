"use client";

import { FadeIn, InkReveal } from "@/components/motion-root";
import { CourtroomControlPanel } from "@/components/court/courtroom-control-panel";
import { CourtroomMainPanel } from "@/components/court/courtroom-main-panel";
import { RoundtableReadinessBanner } from "@/components/roundtable/roundtable-readiness-banner";
import { useRoundtableSession, type SkillOpt } from "@/components/roundtable/use-roundtable-session";

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

  return (
    <FadeIn>
      <InkReveal className="court-page space-y-5">
        <RoundtableReadinessBanner readiness={session.readiness} />
        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[400px_minmax(0,1fr)]">
          <CourtroomControlPanel
            skills={skills}
            topic={session.topic}
            selected={session.selected}
            maxRounds={session.maxRounds}
            streaming={session.streaming}
            currentStep={session.currentStep}
            canStartRoundtable={session.canStartRoundtable}
            exportMd={session.exportMd}
            skillNameRecord={session.skillNameRecord}
            state={session.state}
            onTopicChange={session.setTopic}
            onToggleSkill={session.toggle}
            onSetMaxRounds={session.setMaxRounds}
            onStart={session.startFresh}
            onSeal={session.sealEnd}
          />
          <CourtroomMainPanel
            state={session.state}
            live={session.live}
            activeTurn={session.activeTurn}
            maxRounds={session.maxRounds}
            streaming={session.streaming}
            error={session.error}
            userDraft={session.userDraft}
            onUserDraftChange={session.setUserDraft}
            onSubmit={session.submitVoiceAndContinue}
            onContinue={session.continueRound}
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
        </div>
      </InkReveal>
    </FadeIn>
  );
}
