"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Timeline } from "@/components/roundtable/timeline";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import { SessionUserPanel } from "@/components/roundtable/session-user-panel";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import type { RoundtableState } from "@/lib/spec/schema";

type LiveTokens = { role: "moderator" | "speaker"; skillId?: string; text: string } | null;

type Props = {
  state: RoundtableState | null;
  live: LiveTokens;
  streaming: boolean;
  userDraft: string;
  onUserDraftChange: (value: string) => void;
  onContinue: () => void;
  onSubmit: () => void;
  onSeal: () => void;
};

export function RoundtableMainPanel({
  state,
  live,
  streaming,
  userDraft,
  onUserDraftChange,
  onContinue,
  onSubmit,
  onSeal,
}: Props) {
  const [memoryOpen, setMemoryOpen] = useState(false);

  return (
    <div className="mt-6 min-w-0 space-y-4 lg:mt-0 lg:flex lg:min-h-0 lg:flex-col lg:space-y-3">
      {state ? (
        <div className="space-y-1 text-sm text-ink-700 lg:shrink-0">
          <div className="flex items-center gap-2">
            <span>
              第 {state.round} / {state.maxRounds} 轮 · 此刻{" "}
              <span className="text-cinnabar-700">{phaseInWords(state.phase)}</span>
            </span>
          </div>
          {state.moderatorMemory ? (
            <button
              type="button"
              onClick={() => setMemoryOpen((open) => !open)}
              className="flex items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-700"
            >
              {memoryOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              主持手记
            </button>
          ) : null}
          {memoryOpen && state.moderatorMemory ? (
            <div className="rounded-xl bg-card p-3 text-xs text-ink-600 ring-border">{state.moderatorMemory}</div>
          ) : null}
        </div>
      ) : null}
      <div className="lg:min-h-0 lg:flex-1">
        {state ? (
          <Timeline
            transcript={state.transcript}
            participantIds={state.participantSkillIds}
            skillTitle={(id) => getSkillDisplay(id).label}
            liveTokens={live}
            round={state.round}
            maxRounds={state.maxRounds}
            className="lg:pr-2"
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-600 lg:h-full lg:min-h-[400px]">
            选好议题与列席，点「开席」即可开始。
          </div>
        )}
      </div>
      {state?.phase === "await_user" && !streaming ? (
        <SessionUserPanel
          value={userDraft}
          title="席间插话"
          description="本轮已收束。写下观点后「记入并续轮」，或直接续轮跳过。"
          placeholder="写你想补充的判断、质疑或例子…"
          submitLabel="记入并续轮"
          continueLabel="直接续轮"
          sealLabel="钤印结案"
          onChange={onUserDraftChange}
          onSubmit={onSubmit}
          onContinue={onContinue}
          onSeal={onSeal}
        />
      ) : null}
      {state?.synthesis ? <SynthesisDialog content={state.synthesis} /> : null}
    </div>
  );
}
