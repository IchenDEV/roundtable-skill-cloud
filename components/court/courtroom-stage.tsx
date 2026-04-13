"use client";

import { useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CourtAdvocateSprite } from "@/components/court/court-advocate-sprite";
import { useCourtStrikeEffect } from "@/components/court/use-court-strike-effect";
import { MarkdownContent } from "@/components/roundtable/markdown-content";
import type { RoundtableActiveTurn } from "@/lib/roundtable/active-turn";
import type { TranscriptEntry } from "@/lib/spec/schema";
import { cn } from "@/lib/utils";

type LiveTokens = { role: "moderator" | "speaker"; skillId?: string; text: string } | null;

type Props = {
  transcript: TranscriptEntry[];
  participantIds: string[];
  skillTitle: (id: string) => string;
  liveTokens: LiveTokens;
  activeTurn: RoundtableActiveTurn;
  round: number;
  maxRounds: number;
  phaseLabel: string;
};

function roleLabel(entry: { role: string; skillId?: string }, skillTitle: (id: string) => string) {
  if (entry.role === "moderator") return "审判长";
  if (entry.role === "user") return "席上（你）";
  return entry.skillId ? skillTitle(entry.skillId) : "列席";
}

function latestSpeaker(transcript: TranscriptEntry[], liveTokens: LiveTokens, skillTitle: (id: string) => string) {
  if (liveTokens) return { content: liveTokens.text, label: roleLabel(liveTokens, skillTitle), streaming: true };
  const latest = transcript.at(-1);
  if (!latest) return { content: "堂上无声。择定议题与列席，鸣槌开庭。", label: "候审", streaming: false };
  return { content: latest.content, label: roleLabel(latest, skillTitle), streaming: false };
}

export function CourtroomStage({
  transcript,
  participantIds,
  skillTitle,
  liveTokens,
  activeTurn,
  round,
  maxRounds,
  phaseLabel,
}: Props) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLElement | null>(null);
  const activeSkillId = activeTurn?.role === "speaker" ? activeTurn.skillId : undefined;
  const targetSkillId = activeTurn?.target;
  const latest = useMemo(() => latestSpeaker(transcript, liveTokens, skillTitle), [liveTokens, skillTitle, transcript]);
  const spriteActive = !!liveTokens || activeTurn?.role === "speaker";
  const roleState = {
    moderator: activeTurn?.role === "moderator",
    speaker: activeTurn?.role === "speaker" || !!liveTokens,
    user: false,
  };

  useCourtStrikeEffect(activeTurn, stageRef);

  return (
    <section
      ref={stageRef}
      className={cn("court-stage court-stage-vn overflow-hidden bg-ink-900 text-paper-50 shadow-2xl")}
    >
      <div className="court-vn-bg" aria-hidden>
        <div className="court-vn-column court-vn-column-left" />
        <div className="court-vn-column court-vn-column-right" />
        <div className="court-vn-rail court-vn-rail-top" />
        <div className="court-vn-rail court-vn-rail-mid" />
        <div className="court-vn-panels" />
        <div className="court-vn-bench" />
        <div className="court-vn-vignette" />
      </div>
      <div className="court-vn-hud">
        <span>
          第 {round} / {maxRounds} 庭 · {phaseLabel}
        </span>
        {activeSkillId ? <span>发言：{skillTitle(activeSkillId)}</span> : null}
        {targetSkillId ? <span>逼问：{skillTitle(targetSkillId)}</span> : null}
      </div>
      <div className="court-vn-cast" aria-label="公堂角色">
        <span className={cn("court-vn-cast-pill", roleState.moderator && "is-active")}>审判长</span>
        <span className={cn("court-vn-cast-pill", roleState.speaker && "is-active")}>
          {activeSkillId ? skillTitle(activeSkillId) : "列席辩士"}
        </span>
        <span className={cn("court-vn-cast-pill", roleState.user && "is-active")}>席上（你）</span>
      </div>
      {activeTurn?.directive ? <div className="court-vn-directive">质询方向：{activeTurn.directive}</div> : null}
      <motion.div
        className="court-vn-sprite"
        animate={spriteActive && !reduce ? { x: [0, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.22, repeat: spriteActive && !reduce ? 1 : 0 }}
      >
        <CourtAdvocateSprite active={spriteActive} />
      </motion.div>
      <div className="court-vn-roster" aria-label="列席席位">
        {participantIds.slice(0, 6).map((id) => (
          <span
            key={id}
            className={cn(
              "court-vn-roster-pill",
              activeSkillId === id && "is-active",
              targetSkillId === id && "is-target"
            )}
          >
            {skillTitle(id)}
          </span>
        ))}
      </div>
      <div className="court-dialogue">
        <div className="court-dialogue-name">{latest.label}</div>
        <div className="court-dialogue-copy">
          <div className="court-dialogue-scroll">
            <MarkdownContent content={latest.content} streaming={latest.streaming} />
          </div>
          {latest.streaming ? <span className="court-dialogue-status">记录中</span> : null}
          <span className="court-dialogue-next" aria-hidden />
        </div>
      </div>
      <div className="court-vn-commands" aria-hidden>
        <span>
          <kbd>E</kbd> 法庭记录
        </span>
        <span>
          <kbd>T</kbd> 历史记录
        </span>
        <span>
          <kbd>G</kbd> 设置
        </span>
        <span>
          <kbd>F</kbd> 自动播放
        </span>
      </div>
    </section>
  );
}
