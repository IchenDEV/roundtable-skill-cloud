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
    <div className="space-y-5">
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
        <SessionUserPanel
          value={userDraft}
          title="席间陈词"
          description="本庭已收束。写下补充、质疑或证据，再续下一庭。"
          placeholder="写下你的追问或判断..."
          submitLabel="呈上并续庭"
          continueLabel="直接续庭"
          sealLabel="结案"
          containerClassName="border border-gold-500/50 bg-ink-900/85 text-paper-50 card-dark-elevated"
          textareaClassName="border-paper-50/20 bg-paper-50/95 focus:ring-2"
          continueClassName="rounded-xl border-paper-50/20 bg-paper-50/8 text-paper-50 hover:bg-paper-50/14 hover:text-paper-50 active:scale-[0.99]"
          sealClassName="rounded-xl border-gold-500/70 bg-gold-500/10 text-paper-50 hover:bg-gold-500/18 hover:text-paper-50 active:scale-[0.99]"
          onChange={onUserDraftChange}
          onSubmit={onSubmit}
          onContinue={onContinue}
          onSeal={onSeal}
        />
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
