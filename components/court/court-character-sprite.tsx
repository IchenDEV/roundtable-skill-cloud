"use client";

import { cva } from "class-variance-authority";
import type { CourtCharacterMood, CourtCharacterRole } from "@/components/court/court-character-config";
import { buildCourtCharacterAppearance } from "@/components/court/court-character-config";
import { cn } from "@/lib/utils";

type Props = {
  role: CourtCharacterRole;
  mood?: CourtCharacterMood;
  seed: string;
  mirror?: boolean;
  className?: string;
};

const characterVariants = cva("court-character", {
  variants: {
    mood: {
      idle: null,
      active: "court-character-active",
    },
    mirror: {
      false: null,
      true: "court-character-mirror",
    },
  },
  defaultVariants: {
    mood: "idle",
    mirror: false,
  },
});

export function CourtCharacterSprite({ role, mood = "idle", seed, mirror = false, className }: Props) {
  // 立绘只消费外部配置，不再自己持有配色与姿态规则，方便后续继续换风格。
  const appearance = buildCourtCharacterAppearance(seed, role);
  const { adornment, pose, style } = appearance;

  return (
    <svg
      className={cn(characterVariants({ mood, mirror }), `court-character--${role}`, className)}
      style={style}
      viewBox="0 0 280 340"
      aria-hidden
    >
      <ellipse className="court-character-shadow" cx="140" cy="316" rx="92" ry="18" />
      <path
        className="court-character-glow"
        d="M46 282c16-34 49-70 98-72 60-3 98 29 112 74-31 18-78 26-129 24-34-1-61-9-81-26Z"
      />
      <path className="court-character-robe" d="M76 316 92 184l50-24 50 24 16 132H76Z" />
      <path className="court-character-robe-shade" d="M138 168 180 186l15 130h-57V168Z" />
      <path className="court-character-outline" d="M92 184 140 160l48 24" />
      <path className="court-character-collar" d="M116 182h48l12 104h-72l12-104Z" />
      <path className="court-character-collar-shadow" d="M143 182h21l10 100h-31V182Z" />
      <path className="court-character-accent" d="M133 192h20l-7 106h-16l3-70Z" />
      <path className="court-character-accent-shadow" d="M150 196h7l-11 102h-8l12-69Z" />
      <path className="court-character-trim-line" d="M104 208h72" />
      <path className="court-character-neck" d="M125 132h30v38h-30Z" />
      <path className="court-character-neck-shade" d="M140 132h15v34h-15Z" />
      <path
        className="court-character-face"
        d="M94 60c16-20 78-25 97 6 12 20 7 64-3 84-8 15-31 35-48 35-21 0-47-20-56-43-11-27-8-62 10-82Z"
      />
      <path
        className="court-character-face-shade"
        d="M98 124c8 36 24 59 42 60 17 0 39-16 50-41-4 30-20 59-50 59-27 0-47-23-54-54 0-9 4-19 12-24Z"
      />
      <path
        className="court-character-face-highlight"
        d="M116 92c18-13 52-18 64-2-14 1-29 8-45 19-10 7-20 12-29 15 2-13 5-23 10-32Z"
      />
      <path
        className="court-character-hair"
        d={
          adornment === "crown"
            ? "M84 94c12-38 38-56 69-57 35-1 61 19 71 55-20-10-37-12-52-12-23 0-53 5-88 14Z"
            : "M80 98c10-31 34-61 71-61 33 0 61 17 75 50-14-5-29-8-44-8-36 0-63 9-102 19Z"
        }
      />
      <path
        className="court-character-hair-shade"
        d={
          adornment === "bun"
            ? "M170 43c18 1 32 14 31 29-10-3-20-5-30-6-10 0-19 1-30 4 2-17 13-28 29-27Z"
            : adornment === "crown"
              ? "M102 54h76l-10 21h-57z"
              : "M102 63c14-18 56-25 82-11-20 1-43 6-70 15Z"
        }
      />
      {role === "judge" ? <path className="court-character-headpiece" d="M88 52h106l14 18H74z" /> : null}
      <path className="court-character-brow" d="M110 113c10-8 28-12 42-9" />
      <path className="court-character-brow" d="M160 105c10-4 21-3 30 1" />
      <ellipse className="court-character-eye" cx="126" cy="124" rx="6" ry="4.5" />
      <ellipse className="court-character-eye" cx="167" cy="118" rx="6" ry="4.5" />
      <circle className="court-character-eye-glint" cx="128" cy="122.5" r="1.4" />
      <circle className="court-character-eye-glint" cx="169" cy="116.5" r="1.4" />
      <path className="court-character-nose" d="M158 125c-3 11-8 21-15 30 8 1 15-1 22-4" />
      <path className="court-character-mouth" d="M125 165c18 9 35 9 52-1" />
      <path
        className="court-character-outline"
        d="M96 62c16-20 78-25 97 6 12 20 7 64-3 84-8 15-31 35-48 35-21 0-47-20-56-43-11-27-8-62 10-82Z"
      />
      <path className="court-character-sleeve" d="M104 190 50 220 39 280l42 5 44-67Z" />
      <path className="court-character-sleeve-shade" d="M56 223 39 280l24 3 34-42Z" />
      <path className="court-character-hand" d="M34 276c9-15 29-24 44-15 11 6 11 18 4 24-12 10-40 9-48-9Z" />
      <path className="court-character-hand-shade" d="M53 263c13-2 22 3 25 13-7 6-18 8-30 7-4-5-2-13 5-20Z" />
      <path className="court-character-outline" d="M104 190 50 220 39 280" />
      <path className="court-character-sleeve" d="M176 190 226 220 239 282l-42 4-40-65Z" />
      <path className="court-character-sleeve-shade" d="M222 221 239 282l-25 3-31-44Z" />
      {pose === "gavel" ? (
        <>
          <path className="court-character-hand" d="M214 258c11-10 33-15 44-5 8 7 6 19-3 24-13 7-33 4-41-19Z" />
          <rect
            className="court-character-accessory"
            x="210"
            y="214"
            width="16"
            height="46"
            rx="6"
            transform="rotate(16 210 214)"
          />
          <rect
            className="court-character-accessory-head"
            x="227"
            y="194"
            width="34"
            height="18"
            rx="6"
            transform="rotate(16 227 194)"
          />
        </>
      ) : pose === "scroll" ? (
        <>
          <path className="court-character-hand" d="M203 257c10-7 27-9 40-4 11 4 12 17 4 23-14 9-34 4-44-19Z" />
          <path className="court-character-scroll" d="M196 218c12-5 33-6 46 0l-4 40c-10 6-26 7-39 2Z" />
          <path className="court-character-scroll-line" d="M206 232c10 2 18 1 28-1" />
          <path className="court-character-scroll-line" d="M205 244c11 2 21 2 30-1" />
        </>
      ) : (
        <>
          <path className="court-character-hand" d="M204 258c13-8 28-9 39-3 11 6 10 20 0 25-15 8-31 1-39-22Z" />
          <path className="court-character-hand-pose" d="M225 225c10 7 14 20 9 30-10 2-18 0-27-7 1-10 7-20 18-23Z" />
        </>
      )}
      {role === "attendee" ? <path className="court-character-outline" d="M116 205c16 12 33 17 48 0" /> : null}
      {role === "speaker" ? <path className="court-character-outline" d="M128 202c6 18 18 28 32 39" /> : null}
      {role === "judge" ? <path className="court-character-outline" d="M142 198c0 22 5 36 16 55" /> : null}
      <path className="court-character-button" d="M131 225a6 6 0 1 0 12 0 6 6 0 1 0-12 0Z" />
      <path className="court-character-button" d="M130 258a5 5 0 1 0 10 0 5 5 0 1 0-10 0Z" />
    </svg>
  );
}
