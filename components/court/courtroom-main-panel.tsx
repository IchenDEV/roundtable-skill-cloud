"use client";

import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import { SessionErrorCard } from "@/components/roundtable/session-error-card";
import { SessionUserPanel } from "@/components/roundtable/session-user-panel";
import { CourtroomStage } from "@/components/court/courtroom-stage";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import type { RoundtableActiveTurn } from "@/lib/roundtable/active-turn";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import type { RoundtableState } from "@/lib/spec/schema";

type LiveTokens = { role: "moderator" | "speaker"; skillId?: string; text: string } | null;

type Props = {
  state: RoundtableState | null;
  live: LiveTokens;
  activeTurn: RoundtableActiveTurn;
  maxRounds: number;
  streaming: boolean;
  error: string | null;
  userDraft: string;
  onUserDraftChange: (value: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onSeal: () => void;
  onResume: () => void;
  onRefresh: () => void;
};

const courtUserPanelLayoutClassName = "relative z-10 mx-3 -mt-3 sm:mx-4 lg:mx-0 lg:-mt-5 lg:ml-6 lg:max-w-[44rem]";

const courtUserPanelStyles = {
  container:
    "rounded-[1.6rem] border border-ink-900/10 bg-[linear-gradient(180deg,rgba(244,239,228,0.97),rgba(236,226,205,0.95))] text-ink-800 shadow-[0_-12px_30px_rgba(28,25,20,0.14),0_18px_34px_rgba(28,25,20,0.1),inset_0_1px_0_rgba(255,255,255,0.55)]",
  title: "font-serif text-[0.95rem] tracking-[0.14em] text-cinnabar-700",
  description: "text-[0.78rem] leading-6 text-ink-500",
  textarea:
    "mt-3 min-h-[4.8rem] border-ink-900/10 bg-paper-50/92 shadow-[inset_0_1px_3px_rgba(28,25,20,0.06)] focus:border-cinnabar-600/30 focus:ring-2 focus:ring-cinnabar-600/15",
  actions: "mt-3 gap-2.5",
  submit:
    "rounded-xl bg-cinnabar-600 text-paper-50 shadow-[0_8px_18px_rgba(166,61,61,0.22)] hover:bg-cinnabar-700 active:scale-[0.99]",
  continue:
    "rounded-xl border-ink-900/10 bg-paper-50/76 text-ink-700 hover:border-cinnabar-600/30 hover:bg-paper-50 hover:text-ink-900 active:scale-[0.99]",
  seal: "rounded-xl border-cinnabar-600/30 bg-cinnabar-600/8 text-cinnabar-700 hover:bg-cinnabar-600/12 hover:text-cinnabar-800 active:scale-[0.99]",
};

export function CourtroomMainPanel({
  state,
  live,
  activeTurn,
  maxRounds,
  streaming,
  error,
  userDraft,
  onUserDraftChange,
  onSubmit,
  onContinue,
  onSeal,
  onResume,
  onRefresh,
}: Props) {
  return (
    <div className="h-full space-y-5">
      <CourtroomStage
        transcript={state?.transcript ?? []}
        participantIds={state?.participantSkillIds ?? []}
        skillTitle={(id) => getSkillDisplay(id).label}
        liveTokens={live}
        activeTurn={activeTurn}
        round={state?.round ?? 0}
        maxRounds={state?.maxRounds ?? maxRounds}
        phaseLabel={state ? phaseInWords(state.phase) : "待开庭"}
      />
      {state?.phase === "await_user" && !streaming ? (
        <div className={courtUserPanelLayoutClassName}>
          <SessionUserPanel
            value={userDraft}
            title="席间陈词"
            description="本庭已暂收束。补一纸旁证、追问或异议，再续下一庭。"
            placeholder="写下你的追问、判断，或准备递上的证据片段..."
            submitLabel="呈上并续庭"
            continueLabel="直接续庭"
            sealLabel="结案"
            containerClassName={courtUserPanelStyles.container}
            titleClassName={courtUserPanelStyles.title}
            descriptionClassName={courtUserPanelStyles.description}
            textareaClassName={courtUserPanelStyles.textarea}
            submitClassName={courtUserPanelStyles.submit}
            continueClassName={courtUserPanelStyles.continue}
            sealClassName={courtUserPanelStyles.seal}
            actionsClassName={courtUserPanelStyles.actions}
            onChange={onUserDraftChange}
            onSubmit={onSubmit}
            onContinue={onContinue}
            onSeal={onSeal}
          />
        </div>
      ) : null}
      <SessionErrorCard
        error={error}
        canResume={!!state && state.transcript.length > 0}
        resumeLabel="从中断处续庭"
        onResume={onResume}
        onRefresh={onRefresh}
      />
      {state?.synthesis ? <SynthesisDialog content={state.synthesis} /> : null}
    </div>
  );
}
