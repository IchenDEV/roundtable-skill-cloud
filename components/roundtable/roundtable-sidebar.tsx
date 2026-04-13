"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionActionToolbar } from "@/components/roundtable/session-action-toolbar";
import { SessionErrorCard } from "@/components/roundtable/session-error-card";
import { SessionRoundsField } from "@/components/roundtable/session-rounds-field";
import { SessionTopicField } from "@/components/roundtable/session-topic-field";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import { cn } from "@/lib/utils";
import type { SkillOpt } from "@/components/roundtable/use-roundtable-session";
import type { RoundtableState } from "@/lib/spec/schema";

const CATEGORY_ORDER = ["军事战略", "政治治国", "哲学思想", "商业投资", "科技理工", "谋略纵横", "其他"];

type Props = {
  skills: SkillOpt[];
  topic: string;
  selected: string[];
  maxRounds: number;
  mode: "discussion" | "debate";
  streaming: boolean;
  recommendLoading: boolean;
  recommendError: string | null;
  currentStep: string | null;
  error: string | null;
  canStartRoundtable: boolean;
  hasSession: boolean;
  exportMd: string;
  state: RoundtableState | null;
  skillNameRecord: Record<string, string>;
  onTopicChange: (value: string) => void;
  onToggleSkill: (skillId: string) => void;
  onSetSelected: (skillIds: string[]) => void;
  onRecommend: () => void;
  onSetMaxRounds: (value: number) => void;
  onSetMode: (mode: "discussion" | "debate") => void;
  onStart: () => void;
  onSeal: () => void;
  onResume: () => void;
  onRefresh: () => void;
};

export function RoundtableSidebar({
  skills,
  topic,
  selected,
  maxRounds,
  mode,
  streaming,
  recommendLoading,
  recommendError,
  currentStep,
  error,
  canStartRoundtable,
  hasSession,
  exportMd,
  state,
  skillNameRecord,
  onTopicChange,
  onToggleSkill,
  onSetSelected,
  onRecommend,
  onSetMaxRounds,
  onSetMode,
  onStart,
  onSeal,
  onResume,
  onRefresh,
}: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set([CATEGORY_ORDER[0]]));
  const groupedSkills = useMemo(() => {
    const groups: Record<string, SkillOpt[]> = {};
    for (const skill of skills) {
      const category = skill.category || "其他";
      if (!groups[category]) groups[category] = [];
      groups[category].push(skill);
    }
    return groups;
  }, [skills]);
  const orderedCategories = useMemo(
    () => CATEGORY_ORDER.filter((category) => groupedSkills[category]?.length > 0),
    [groupedSkills]
  );

  return (
    <aside className="space-y-4 rounded-2xl bg-card p-5 card-elevated lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto lg:pr-3 lg:overscroll-contain">
      <SessionTopicField label="今日所议" value={topic} onChange={onTopicChange} />
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-900">请哪些视角入席</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={streaming || recommendLoading || !topic.trim() || skills.length === 0}
            onClick={onRecommend}
            className="font-sans text-xs"
          >
            {recommendLoading ? <Loader2 className="size-3 animate-spin" /> : "智能推荐"}
          </Button>
        </div>
        {state?.participantSkillIds.length ? (
          <p className="mt-1 text-xs leading-6 text-ink-500">
            当前这一席：{state.participantSkillIds.map((skillId) => getSkillDisplay(skillId).label).join("、")}
            。若改动左侧勾选，需重新点「开席」才会换人。
          </p>
        ) : (
          <p className="mt-1 text-xs text-ink-500">未开席前不会默认替你选人，请先明确列席再开谈。</p>
        )}
        {recommendError ? <p className="mt-1 text-xs text-cinnabar-700">{recommendError}</p> : null}
        <div className="mt-2 space-y-1">
          {orderedCategories.map((category) => {
            const categorySkills = groupedSkills[category] ?? [];
            const isOpen = openCategories.has(category);
            const selectedCount = categorySkills.filter((skill) => selected.includes(skill.skillId)).length;
            return (
              <div key={category} className="rounded-lg ring-border">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(category)) next.delete(category);
                      else next.add(category);
                      return next;
                    })
                  }
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-ink-700 hover:bg-ink-50"
                >
                  <span className="flex items-center gap-1">
                    {isOpen ? (
                      <ChevronDown className="size-3 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3 shrink-0" />
                    )}
                    {category}
                  </span>
                  <span className="text-ink-400">
                    {selectedCount > 0 ? `已选 ${selectedCount} / ` : ""}共 {categorySkills.length}
                  </span>
                </button>
                {isOpen ? (
                  <div className="flex flex-wrap gap-1.5 px-2 py-2 divider-t">
                    {categorySkills.map((skill) => {
                      const display = getSkillDisplay(skill.skillId);
                      const active = selected.includes(skill.skillId);
                      return (
                        <Button
                          key={skill.skillId}
                          type="button"
                          variant="outline"
                          size="sm"
                          title={display.brief}
                          onClick={() => onToggleSkill(skill.skillId)}
                          className={cn(
                            "rounded-lg font-sans text-xs transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                            active &&
                              "border-transparent ring-brand bg-cinnabar-600/10 text-cinnabar-600 hover:bg-cinnabar-600/15"
                          )}
                        >
                          {display.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <SessionRoundsField label="最多几轮" value={maxRounds} onChange={onSetMaxRounds} />
        <div className="flex items-center gap-0.5 rounded-xl p-0.5 ring-border">
          {(["discussion", "debate"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => onSetMode(nextMode)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs transition-colors",
                mode === nextMode ? "bg-ink-900 text-paper-50" : "text-ink-600 hover:bg-ink-100"
              )}
            >
              {nextMode === "discussion" ? "讨论" : "辩论"}
            </button>
          ))}
        </div>
      </div>
      {streaming ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ink-600" aria-live="polite">
          <Loader2 className="size-4 shrink-0 animate-spin text-cinnabar-700" aria-hidden />
          {currentStep || "执笔流转中…"}
        </p>
      ) : null}
      <SessionActionToolbar
        state={state}
        exportMd={exportMd}
        streaming={streaming}
        canStart={canStartRoundtable && skills.length > 0 && selected.length > 0}
        canSeal={hasSession && state?.phase !== "done"}
        startLabel={state ? "另起新席" : "开席"}
        sealLabel="钤印结案"
        skillNameRecord={skillNameRecord}
        onStart={onStart}
        onSeal={onSeal}
      />
      <SessionErrorCard
        error={error}
        canResume={!!state && state.transcript.length > 0}
        resumeLabel="从中断处续轮"
        onResume={onResume}
        onRefresh={onRefresh}
      />
      {state?.participantSkillIds.length === 0 && selected.length > 0 ? (
        <button
          type="button"
          onClick={() => onSetSelected([])}
          className="text-xs text-ink-500 underline underline-offset-2"
        >
          清空当前勾选
        </button>
      ) : null}
    </aside>
  );
}
