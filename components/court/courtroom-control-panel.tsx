"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CourtroomMusicToggle } from "@/components/court/courtroom-music-toggle";
import { SessionActionToolbar } from "@/components/roundtable/session-action-toolbar";
import { SessionRoundsField } from "@/components/roundtable/session-rounds-field";
import { SessionTopicField } from "@/components/roundtable/session-topic-field";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import { cn } from "@/lib/utils";
import type { SkillOpt } from "@/components/roundtable/use-roundtable-session";
import type { RoundtableState } from "@/lib/spec/schema";

type Props = {
  skills: SkillOpt[];
  topic: string;
  selected: string[];
  maxRounds: number;
  streaming: boolean;
  currentStep: string | null;
  canStartRoundtable: boolean;
  exportMd: string;
  skillNameRecord: Record<string, string>;
  state: RoundtableState | null;
  onTopicChange: (value: string) => void;
  onToggleSkill: (skillId: string) => void;
  onSetMaxRounds: (value: number) => void;
  onStart: () => void;
  onSeal: () => void;
};

const lightActionButtonClass =
  "rounded-xl border-ink-200/60 bg-card text-ink-800 hover:border-cinnabar-600/40 hover:bg-paper-50 active:scale-[0.99]";

export function CourtroomControlPanel({
  skills,
  topic,
  selected,
  maxRounds,
  streaming,
  currentStep,
  canStartRoundtable,
  exportMd,
  skillNameRecord,
  state,
  onTopicChange,
  onToggleSkill,
  onSetMaxRounds,
  onStart,
  onSeal,
}: Props) {
  return (
    <aside className="h-full rounded-2xl bg-card p-5 text-ink-800 card-elevated lg:sticky lg:top-5">
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
      <div className="mt-5">
        <SessionTopicField label="案由" value={topic} rows={3} onChange={onTopicChange} />
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-900">列席</span>
          <span className="font-sans text-xs text-ink-500">已选 {selected.length} 位</span>
        </div>
        <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl bg-paper-50/70 p-3 ring-border">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const display = getSkillDisplay(skill.skillId);
              const active = selected.includes(skill.skillId);
              return (
                <button
                  key={skill.skillId}
                  type="button"
                  title={display.brief}
                  onClick={() => onToggleSkill(skill.skillId)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 font-sans text-xs transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                    active
                      ? "border-transparent ring-brand bg-cinnabar-600/10 text-cinnabar-700 hover:bg-cinnabar-600/15"
                      : "border-ink-200/70 bg-card text-ink-600 hover:border-cinnabar-600/40 hover:text-cinnabar-700"
                  )}
                >
                  {display.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <SessionRoundsField label="庭数" value={maxRounds} onChange={onSetMaxRounds} />
          <CourtroomMusicToggle />
        </div>
        <SessionActionToolbar
          state={state}
          exportMd={exportMd}
          streaming={streaming}
          canStart={canStartRoundtable && skills.length > 0 && selected.length > 0}
          canSeal={!!state && state.phase !== "done"}
          startLabel="升堂"
          sealLabel="结案"
          utilityClassName={cn("min-w-[96px]", lightActionButtonClass)}
          homeHref="/roundtable"
          homeLabel="回圆桌"
          skillNameRecord={skillNameRecord}
          onStart={onStart}
          onSeal={onSeal}
        />
      </div>
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
      {skills.length === 0 ? (
        <div className="mt-4 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-ink-800 ring-destructive">
          讨论席名录尚未备好，无法升堂。请待维护者处理后再来，或返回
          <Link href="/" className="text-cinnabar-700 underline">
            序页
          </Link>
          查看说明。
        </div>
      ) : null}
    </aside>
  );
}
