"use client";

import { cva } from "class-variance-authority";
import { CourtCharacterSprite } from "@/components/court/court-character-sprite";
import {
  buildCourtPortraitMeta,
  type CourtCharacterMood,
  type CourtCharacterRole,
} from "@/components/court/court-character-config";
import { cn } from "@/lib/utils";

type Props = {
  role: CourtCharacterRole;
  label: string;
  seed: string;
  mood?: CourtCharacterMood;
  mirror?: boolean;
  target?: boolean;
  depth?: "front" | "rear";
  className?: string;
};

const portraitCardVariants = cva("court-vn-card", {
  variants: {
    role: {
      judge: "court-vn-card--judge",
      speaker: "court-vn-card--speaker",
      attendee: "court-vn-card--attendee",
    },
    mood: {
      idle: null,
      active: "is-active",
    },
    target: {
      false: null,
      true: "is-target",
    },
    depth: {
      front: null,
      rear: "is-rear",
    },
  },
  defaultVariants: {
    mood: "idle",
    target: false,
    depth: "front",
  },
});

// 外框卡片单独承接头衔、徽记和角色氛围，舞台主组件只描述“谁站在哪里”。
export function CourtPortraitCard({
  role,
  label,
  seed,
  mood = "idle",
  mirror = false,
  target = false,
  depth = "front",
  className,
}: Props) {
  const meta = buildCourtPortraitMeta(role, label);

  return (
    <div className={cn(portraitCardVariants({ role, mood, target, depth }), className)}>
      <span className={cn("court-vn-card-ribbon", `is-${meta.tone}`)}>{meta.ribbon}</span>
      <span className="court-vn-portrait-tag">{meta.title}</span>
      <span className={cn("court-vn-card-emblem", `is-${meta.tone}`)}>{meta.emblem}</span>
      <CourtCharacterSprite role={role} mood={mood} seed={seed} mirror={mirror} />
    </div>
  );
}
