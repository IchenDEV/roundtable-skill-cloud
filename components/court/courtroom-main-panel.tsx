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

const courtUserPanelLayoutClassName = "relative z-10";

const courtUserPanelStyles = {
  container: "rounded-2xl bg-card p-5 text-ink-800 card-elevated",
  title: "font-sans text-xs tracking-[0.24em] text-ink-500",
  description: "mt-3 text-sm leading-7 text-ink-600",
  textarea:
    "mt-4 min-h-[4.8rem] border-ink-200/60 bg-paper-50 px-3 py-2 text-sm text-ink-900 shadow-[inset_0_1px_3px_rgba(28,25,20,0.04)] focus:border-cinnabar-600/30 focus:ring-1 focus:ring-gold-500",
  actions: "mt-4 gap-2.5",
  submit: "rounded-xl bg-cinnabar-600 text-card hover:bg-cinnabar-700 active:scale-[0.99]",
  continue:
    "rounded-xl border-ink-200/60 bg-card text-ink-800 hover:border-cinnabar-600/40 hover:bg-paper-50 active:scale-[0.99]",
  seal: "rounded-xl border-cinnabar-600/50 bg-card text-cinnabar-800 hover:bg-cinnabar-600/10 active:scale-[0.99]",
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
