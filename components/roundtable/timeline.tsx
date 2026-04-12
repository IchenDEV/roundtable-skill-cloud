"use client";

import { useEffect, useRef, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TranscriptEntry } from "@/lib/spec/schema";
import { MarkdownContent } from "./markdown-content";
import { cn } from "@/lib/utils";

type LiveTokens = {
  role: "moderator" | "speaker";
  skillId?: string;
  text: string;
} | null;

type Props = {
  transcript: TranscriptEntry[];
  participantIds: string[];
  skillTitle: (id: string) => string;
  liveTokens: LiveTokens;
  round: number;
  maxRounds: number;
  className?: string;
};

const PALETTE = [
  { bg: "bg-amber-50/60", ring: "border border-amber-600/30", badge: "bg-amber-600 text-white" },
  { bg: "bg-emerald-50/60", ring: "border border-emerald-600/30", badge: "bg-emerald-600 text-white" },
  { bg: "bg-blue-50/60", ring: "border border-blue-600/30", badge: "bg-blue-600 text-white" },
  { bg: "bg-purple-50/60", ring: "border border-purple-600/30", badge: "bg-purple-600 text-white" },
  { bg: "bg-rose-50/60", ring: "border border-rose-600/30", badge: "bg-rose-600 text-white" },
  { bg: "bg-teal-50/60", ring: "border border-teal-600/30", badge: "bg-teal-600 text-white" },
  { bg: "bg-orange-50/60", ring: "border border-orange-600/30", badge: "bg-orange-600 text-white" },
  { bg: "bg-indigo-50/60", ring: "border border-indigo-600/30", badge: "bg-indigo-600 text-white" },
];

const speakerColorCache: Record<string, (typeof PALETTE)[number]> = {};

function getSpeakerColor(skillId: string, participantIds: string[]) {
  if (!speakerColorCache[skillId]) {
    const idx = participantIds.indexOf(skillId);
    speakerColorCache[skillId] = PALETTE[(idx === -1 ? 0 : idx) % PALETTE.length];
  }
  return speakerColorCache[skillId];
}

const MODERATOR_STYLE = {
  bg: "bg-paper-100/60",
  ring: "border border-cinnabar-600/30",
  badge: "bg-cinnabar-700 text-white",
};
const USER_STYLE = {
  bg: "bg-gold-50/60",
  ring: "border border-amber-700/30",
  badge: "bg-gold-700 text-white",
};
const AUTO_FOLLOW_THRESHOLD_PX = 160;

function isNearBottom(target: HTMLElement, threshold = AUTO_FOLLOW_THRESHOLD_PX) {
  return target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
}

function resolveScrollTarget(container: HTMLDivElement | null) {
  if (!container || typeof window === "undefined") return null;

  const styles = window.getComputedStyle(container);
  const containerCanScroll = /(auto|scroll)/.test(styles.overflowY) && container.scrollHeight > container.clientHeight;

  if (containerCanScroll) return container;

  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** Count moderator entries to derive round boundaries */
function computeRounds(transcript: TranscriptEntry[]): number[] {
  const rounds: number[] = [];
  let currentRound = 1;
  let modCount = 0;
  for (const entry of transcript) {
    if (entry.role === "moderator") {
      modCount++;
      currentRound = Math.ceil(modCount / 2);
    }
    rounds.push(currentRound);
  }
  return rounds;
}

const TimelineEntry = memo(function TimelineEntry({
  entry,
  label,
  style,
  isLive,
  index,
  reduce,
}: {
  entry: { content: string; role: string };
  label: string;
  style: { bg: string; ring: string; badge: string };
  isLive: boolean;
  index: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: reduce ? 0 : Math.min(index * 0.03, 0.3) }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-colors duration-300",
        style.bg,
        style.ring,
        isLive && "ring-2 ring-cinnabar-600/40"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("inline-block rounded-lg px-2 py-0.5 text-xs font-medium", style.badge)}>{label}</span>
        {isLive && (
          <span className="inline-flex items-center gap-1 text-xs text-cinnabar-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cinnabar-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cinnabar-500" />
            </span>
            执笔中
          </span>
        )}
      </div>
      <div className="prose-roundtable">
        <MarkdownContent content={entry.content} streaming={isLive} />
      </div>
    </motion.div>
  );
});

export function Timeline({ transcript, participantIds, skillTitle, liveTokens, maxRounds, className }: Props) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const autoFollowRef = useRef(true);
  const rounds = computeRounds(transcript);

  useEffect(() => {
    const updateAutoFollow = () => {
      const target = resolveScrollTarget(containerRef.current);
      if (!target) return;
      autoFollowRef.current = isNearBottom(target);
    };

    updateAutoFollow();

    const container = containerRef.current;
    container?.addEventListener("scroll", updateAutoFollow, { passive: true });
    window.addEventListener("scroll", updateAutoFollow, { passive: true });
    window.addEventListener("resize", updateAutoFollow);

    return () => {
      container?.removeEventListener("scroll", updateAutoFollow);
      window.removeEventListener("scroll", updateAutoFollow);
      window.removeEventListener("resize", updateAutoFollow);
    };
  }, []);

  useEffect(() => {
    const target = resolveScrollTarget(containerRef.current);
    if (!target || !autoFollowRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      target.scrollTo({
        top: target.scrollHeight,
        behavior: liveTokens ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [transcript.length, liveTokens]);

  return (
    <div ref={containerRef} className={cn("space-y-3 px-px py-px", className)}>
      {transcript.map((entry, i) => {
        const entryRound = rounds[i];
        const previousRound = i === 0 ? 0 : rounds[i - 1];
        const showRoundDivider = entryRound > previousRound;

        let label: string;
        let style: { bg: string; ring: string; badge: string };

        if (entry.role === "moderator") {
          label = "主持";
          style = MODERATOR_STYLE;
        } else if (entry.role === "user") {
          label = "席上（你）";
          style = USER_STYLE;
        } else {
          label = entry.skillId ? skillTitle(entry.skillId) : "发言者";
          style = getSpeakerColor(entry.skillId ?? "?", participantIds);
        }

        return (
          <div key={i}>
            {showRoundDivider && (
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-ink-200/40" />
                <span className="text-xs text-ink-500">
                  第 {entryRound} / {maxRounds} 轮
                </span>
                <div className="h-px flex-1 bg-ink-200/40" />
              </div>
            )}
            <TimelineEntry entry={entry} label={label} style={style} isLive={false} index={i} reduce={!!reduce} />
          </div>
        );
      })}

      {liveTokens &&
        (() => {
          let label: string;
          let style: { bg: string; ring: string; badge: string };
          if (liveTokens.role === "moderator") {
            label = "主持";
            style = MODERATOR_STYLE;
          } else {
            label = liveTokens.skillId ? skillTitle(liveTokens.skillId) : "发言者";
            style = getSpeakerColor(liveTokens.skillId ?? "?", participantIds);
          }
          return (
            <TimelineEntry
              entry={{ content: liveTokens.text, role: liveTokens.role }}
              label={label}
              style={style}
              isLive={true}
              index={transcript.length}
              reduce={!!reduce}
            />
          );
        })()}

      {transcript.length === 0 && !liveTokens && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-600 lg:min-h-[400px]">
          选好议题与列席，点「开席」即可开始。
        </div>
      )}
    </div>
  );
}
