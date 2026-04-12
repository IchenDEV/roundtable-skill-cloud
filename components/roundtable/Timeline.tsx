"use client";

import { useEffect, useRef, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TranscriptEntry } from "@/lib/spec/schema";
import { MarkdownContent } from "./MarkdownContent";
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
};

const PALETTE = [
  { bg: "bg-amber-50/60", ring: "shadow-[0_0_0_1px_rgba(217,119,6,0.3)]", badge: "bg-amber-600 text-white" },
  { bg: "bg-emerald-50/60", ring: "shadow-[0_0_0_1px_rgba(5,150,105,0.3)]", badge: "bg-emerald-600 text-white" },
  { bg: "bg-blue-50/60", ring: "shadow-[0_0_0_1px_rgba(37,99,235,0.3)]", badge: "bg-blue-600 text-white" },
  { bg: "bg-purple-50/60", ring: "shadow-[0_0_0_1px_rgba(147,51,234,0.3)]", badge: "bg-purple-600 text-white" },
  { bg: "bg-rose-50/60", ring: "shadow-[0_0_0_1px_rgba(225,29,72,0.3)]", badge: "bg-rose-600 text-white" },
  { bg: "bg-teal-50/60", ring: "shadow-[0_0_0_1px_rgba(13,148,136,0.3)]", badge: "bg-teal-600 text-white" },
  { bg: "bg-orange-50/60", ring: "shadow-[0_0_0_1px_rgba(234,88,12,0.3)]", badge: "bg-orange-600 text-white" },
  { bg: "bg-indigo-50/60", ring: "shadow-[0_0_0_1px_rgba(79,70,229,0.3)]", badge: "bg-indigo-600 text-white" },
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
  ring: "ring-accent",
  badge: "bg-cinnabar-700 text-white",
};
const USER_STYLE = {
  bg: "bg-gold-50/60",
  ring: "shadow-[0_0_0_1px_rgba(161,128,53,0.3)]",
  badge: "bg-gold-700 text-white",
};

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
        "relative rounded-xl p-4 transition-colors duration-300",
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

export function Timeline({ transcript, participantIds, skillTitle, liveTokens, maxRounds }: Props) {
  const reduce = useReducedMotion();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rounds = computeRounds(transcript);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (liveTokens) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [transcript.length, liveTokens]);

  let lastRound = 0;

  return (
    <div ref={containerRef} className="space-y-3">
      {transcript.map((entry, i) => {
        const entryRound = rounds[i];
        const showRoundDivider = entryRound > lastRound;
        lastRound = entryRound;

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

      <div ref={bottomRef} />
    </div>
  );
}
