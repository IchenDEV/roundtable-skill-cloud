"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MarkdownContent } from "@/components/roundtable/markdown-content";
import type { RoundtableActiveTurn } from "@/lib/roundtable/active-turn";
import type { TranscriptEntry } from "@/lib/spec/schema";
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
  if (liveTokens) {
    return {
      content: liveTokens.text,
      label: roleLabel(liveTokens, skillTitle),
      streaming: true,
    };
  }
  const latest = transcript.at(-1);
  if (!latest) {
    return {
      content: "堂上无声。择定议题与列席，鸣槌开庭。",
      label: "候审",
      streaming: false,
    };
  }
  return { content: latest.content, label: roleLabel(latest, skillTitle), streaming: false };
}

function CourtAdvocateSprite({ active }: { active: boolean }) {
  return (
    <svg className={cn("court-advocate", active && "court-advocate-active")} viewBox="0 0 780 720" aria-hidden>
      <g className="court-advocate-shadow">
        <ellipse cx="320" cy="690" rx="250" ry="34" />
      </g>
      <g className="court-advocate-body">
        <path className="court-suit-dark" d="M172 704 226 378 392 360 462 704Z" />
        <path className="court-suit-red" d="M224 402 332 372 446 704H214Z" />
        <path className="court-suit-shadow" d="M228 430 316 404 286 704H196Z" />
        <path className="court-suit-light" d="M344 386 420 684 386 672 326 430Z" />
        <path className="court-shirt" d="M282 378 350 382 374 560 302 552Z" />
        <path className="court-shirt-shadow" d="M346 390 372 558 340 538 330 416Z" />
        <path className="court-tie" d="M319 410 360 412 348 570 300 556Z" />
        <path className="court-tie-shadow" d="M348 418 360 414 348 570 324 562Z" />
        <path className="court-neck" d="M272 318 358 322 354 392 286 404Z" />
        <path className="court-neck-shadow" d="M308 326 358 322 354 382 292 366Z" />
        <path className="court-face" d="M222 178 322 96 446 132 424 282 354 350 250 330 204 256Z" />
        <path className="court-face-shadow" d="M222 256 250 330 354 350 424 282 416 322 360 374 244 350 202 274Z" />
        <path className="court-face-light" d="M282 152 350 126 400 146 318 188 260 208Z" />
        <path
          className="court-hair"
          d="M208 192 272 62 470 94 408 128 510 150 396 166 438 216 350 184 284 292 236 282Z"
        />
        <path className="court-hair-shine" d="M272 82 340 82 292 126 232 180Z" />
        <path className="court-hair-shine" d="M372 102 456 112 402 132 336 136Z" />
        <path className="court-hair-line" d="M270 78 326 150 390 108" />
        <path className="court-hair-line" d="M232 182 310 170 282 292" />
        <path className="court-ear" d="M406 202 452 210 430 270 398 262Z" />
        <path className="court-ear-line" d="M420 220 438 232 414 252" />
        <path className="court-eye" d="M312 206 376 198 376 220 316 226Z" />
        <ellipse className="court-iris" cx="344" cy="210" rx="9" ry="7" />
        <circle className="court-eye-glint" cx="348" cy="207" r="2.5" />
        <path className="court-brow" d="M300 178 390 168 392 184 306 196Z" />
        <path className="court-nose" d="M382 214 368 252 394 250" />
        <path className="court-mouth" d="M322 284 386 274 386 286 320 300Z" />
        <path className="court-jaw-line" d="M260 318 352 338 406 286" />
        <path className="court-arm-sleeve" d="M400 330 504 250 678 140 704 190 536 328 430 412Z" />
        <path className="court-sleeve-shadow" d="M520 254 678 140 704 190 552 300 536 274Z" />
        <path className="court-sleeve-fold" d="M456 304 524 326" />
        <path className="court-sleeve-fold" d="M506 256 548 286" />
        <path className="court-cuff" d="M640 156 692 128 706 184 664 196Z" />
        <ellipse className="court-bracelet" cx="646" cy="174" rx="28" ry="37" transform="rotate(-32 646 174)" />
        <path className="court-bracelet-line" d="M620 160 672 190" />
        <path className="court-hand" d="M666 138 742 120 724 176 760 190 706 204 672 192Z" />
        <path className="court-hand-shadow" d="M706 174 760 190 706 204 672 192Z" />
        <path className="court-finger-line" d="M704 142 740 128" />
        <path className="court-finger-line" d="M696 158 724 176" />
        <path className="court-finger-line" d="M708 188 744 192" />
        <circle className="court-button" cx="264" cy="458" r="9" />
        <circle className="court-button" cx="282" cy="548" r="8" />
        <path className="court-lapel-line" d="M230 412 306 492 256 512" />
        <path className="court-lapel-line" d="M348 392 396 518 368 506" />
        <path className="court-pocket" d="M246 430 318 418 318 438 246 450Z" />
        <path
          className="court-outline"
          d="M224 402 172 704h290L446 704 400 330l104-80 174-110 26 50-168 138-106 84 32 292"
        />
        <path className="court-outline" d="M222 178 322 96l124 36-22 150-70 68-104-20-46-74Z" />
      </g>
    </svg>
  );
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
  const activeSkillId = activeTurn?.role === "speaker" ? activeTurn.skillId : undefined;
  const targetSkillId = activeTurn?.target;
  const latest = useMemo(() => latestSpeaker(transcript, liveTokens, skillTitle), [liveTokens, skillTitle, transcript]);
  const spriteActive = !!liveTokens || activeTurn?.role === "speaker";

  return (
    <section className="court-stage court-stage-vn overflow-hidden bg-ink-900 text-paper-50 shadow-2xl">
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
