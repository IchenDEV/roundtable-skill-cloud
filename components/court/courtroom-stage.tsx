"use client";

import { useMemo, useRef } from "react";
import { cva } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { CourtPortraitCard } from "@/components/court/court-portrait-card";
import { buildCourtStageScene } from "@/components/court/court-stage-scene";
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

const attendeeVariants = cva(null, {
  variants: {
    depth: {
      front: null,
      rear: "is-rear",
    },
  },
  defaultVariants: {
    depth: "front",
  },
});

const castPillVariants = cva("court-vn-cast-pill", {
  variants: {
    active: {
      false: null,
      true: "is-active",
    },
  },
  defaultVariants: {
    active: false,
  },
});

const dialogueCopyVariants = cva("court-dialogue-copy", {
  variants: {
    placeholder: {
      false: null,
      true: "is-placeholder",
    },
  },
  defaultVariants: {
    placeholder: false,
  },
});

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
  const activeRole = activeTurn?.role;
  const activeSkillId = activeTurn?.role === "speaker" ? activeTurn.skillId : undefined;
  const targetSkillId = activeTurn?.target;
  // 将“谁站前景、谁是侧席、对白框展示什么”集中成纯数据，方便测试与后续换皮。
  const scene = useMemo(
    () =>
      buildCourtStageScene({
        transcript,
        participantIds,
        liveTokens,
        activeRole,
        activeSkillId,
        targetSkillId,
        skillTitle,
      }),
    [activeRole, activeSkillId, liveTokens, participantIds, skillTitle, targetSkillId, transcript]
  );
  const spriteActive = !!liveTokens || activeTurn?.role === "speaker";

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
        <span className={castPillVariants({ active: scene.roleState.moderator })}>审判长</span>
        <span className={castPillVariants({ active: scene.roleState.speaker })}>
          {activeSkillId ? skillTitle(activeSkillId) : "当前陈词者"}
        </span>
        <span className={castPillVariants({ active: scene.roleState.user })}>席上（你）</span>
      </div>
      {activeTurn?.directive ? <div className="court-vn-directive">质询方向：{activeTurn.directive}</div> : null}
      <div className="court-vn-portraits" aria-hidden>
        <CourtPortraitCard
          role="judge"
          label="审判长"
          seed="moderator-judge"
          mood={scene.roleState.moderator ? "active" : "idle"}
          className="court-vn-judge-wrap"
        />
        <motion.div
          className="court-vn-speaker"
          animate={spriteActive && !reduce ? { x: [0, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.22, repeat: spriteActive && !reduce ? 1 : 0 }}
        >
          <CourtPortraitCard
            role="speaker"
            label={scene.foregroundLabel}
            seed={scene.foregroundSkillId ?? "speaker"}
            mood={spriteActive ? "active" : "idle"}
          />
        </motion.div>
        <div className="court-vn-attendees">
          {scene.sidePortraitIds.map((id, index) => (
            <CourtPortraitCard
              key={id}
              role="attendee"
              label={skillTitle(id)}
              seed={id}
              mirror={index % 2 === 0}
              mood={activeSkillId === id ? "active" : "idle"}
              target={targetSkillId === id}
              className={cn("court-vn-attendee", attendeeVariants({ depth: index === 1 ? "rear" : "front" }))}
            />
          ))}
        </div>
      </div>
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
        <div className="court-dialogue-name">{scene.latest.label}</div>
        <div className={dialogueCopyVariants({ placeholder: scene.latest.placeholder })}>
          <div className="court-dialogue-scroll">
            <MarkdownContent content={scene.latest.content} streaming={scene.latest.streaming} />
          </div>
          {scene.latest.streaming ? <span className="court-dialogue-status">记录中</span> : null}
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
