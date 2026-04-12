"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TranscriptEntry } from "@/lib/spec/schema";
import { MarkdownContent } from "./MarkdownContent";

type Props = {
  transcript: TranscriptEntry[];
  participantIds: string[];
  skillTitle: (id: string) => string;
  liveTokens: { role: string; skillId?: string; text: string } | null;
};

const USER_LANE = "participant:user";

export function SwimLanes({ transcript, participantIds, skillTitle, liveTokens }: Props) {
  const reduce = useReducedMotion();
  const groups: Record<string, TranscriptEntry[]> = { moderator: [], [USER_LANE]: [] };
  for (const id of participantIds) {
    groups[`speaker:${id}`] = [];
  }
  for (const t of transcript) {
    if (t.role === "user") {
      groups[USER_LANE].push(t);
      continue;
    }
    const key = t.role === "moderator" ? "moderator" : `speaker:${t.skillId ?? "?"}`;
    groups[key] ??= [];
    groups[key].push(t);
  }

  const lanes = [
    { key: "moderator", title: "主持" },
    ...participantIds.map((id) => ({
      key: `speaker:${id}`,
      title: skillTitle(id),
    })),
    { key: USER_LANE, title: "席上（你）" },
  ];

  const activeLaneKey = liveTokens
    ? liveTokens.role === "moderator"
      ? "moderator"
      : `speaker:${liveTokens.skillId}`
    : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {lanes.map(({ key, title }, i) => {
        const isActive = key === activeLaneKey;
        return (
          <motion.section
            key={key}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.06 }}
            className={`rounded-xl bg-card p-3 transition-shadow duration-300 ${
              isActive ? "ring-brand" : "ring-border"
            }`}
          >
            <h3 className="mb-2 flex items-center gap-2 border-b border-ink-200/30 pb-1 text-sm font-semibold text-cinnabar-700">
              {title}
              {isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cinnabar-500/10 px-2 py-0.5 text-xs font-medium text-cinnabar-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cinnabar-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cinnabar-500" />
                  </span>
                  执笔中
                </span>
              )}
            </h3>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {(groups[key] ?? []).map((e, j) => (
                <MarkdownContent key={j} content={e.content} />
              ))}
              {isActive && liveTokens && <MarkdownContent content={liveTokens.text} streaming />}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
