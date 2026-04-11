"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TranscriptEntry } from "@/lib/spec/schema";

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
    { key: USER_LANE, title: "席上（你）" },
    ...participantIds.map((id) => ({
      key: `speaker:${id}`,
      title: skillTitle(id),
    })),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lanes.map(({ key, title }, i) => (
        <motion.section
          key={key}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : i * 0.06 }}
          className="scroll-paper border border-ink-200/50 bg-paper-100/40 p-3 shadow-sm"
        >
          <h3 className="mb-2 border-b border-ink-200/30 pb-1 text-sm font-semibold text-cinnabar-700">{title}</h3>
          <div className="max-h-96 space-y-3 overflow-y-auto text-sm leading-relaxed text-ink-700">
            {(groups[key] ?? []).map((e, j) => (
              <p key={j} className="whitespace-pre-wrap">
                {e.content}
              </p>
            ))}
            {liveTokens &&
              ((key === "moderator" && liveTokens.role === "moderator") ||
                (key === `speaker:${liveTokens.skillId}` && liveTokens.role === "speaker")) && (
                <p className="whitespace-pre-wrap text-ink-900/80">
                  {liveTokens.text}
                  <span className="inline-block w-1 animate-pulse">▍</span>
                </p>
              )}
          </div>
        </motion.section>
      ))}
    </div>
  );
}
