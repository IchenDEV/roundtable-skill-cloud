"use client";

import type { CSSProperties } from "react";

export type CourtCharacterRole = "judge" | "speaker" | "attendee";
export type CourtCharacterMood = "active" | "idle";
type CourtAdornment = "crown" | "bun" | "loose";
type CourtPose = "gavel" | "scroll" | "open-hand";
type CourtSigilTone = "gold" | "crimson" | "jade";

type Palette = {
  robe: string;
  robeShade: string;
  trim: string;
  accent: string;
  accentShade: string;
  hair: string;
  hairShade: string;
  skin: string;
  skinShade: string;
  glow: string;
};

// 用稳定散列而不是随机数，确保同一位列席在不同轮次里保持同一视觉身份。
function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const PARTICIPANT_PALETTES: Palette[] = [
  {
    robe: "#6b3b3f",
    robeShade: "#3e1f27",
    trim: "#d9bb6b",
    accent: "#2f7b80",
    accentShade: "#184c50",
    hair: "#191918",
    hairShade: "#414140",
    skin: "#dca179",
    skinShade: "#b8765c",
    glow: "rgba(244, 216, 120, 0.28)",
  },
  {
    robe: "#2c5662",
    robeShade: "#173640",
    trim: "#d5dce0",
    accent: "#9a6235",
    accentShade: "#6d3d1f",
    hair: "#1a1614",
    hairShade: "#4b362f",
    skin: "#d7a784",
    skinShade: "#b47a5d",
    glow: "rgba(179, 231, 232, 0.24)",
  },
  {
    robe: "#455a3f",
    robeShade: "#243322",
    trim: "#d8d1b2",
    accent: "#935454",
    accentShade: "#6d3131",
    hair: "#171918",
    hairShade: "#4d5650",
    skin: "#d8a88a",
    skinShade: "#b77962",
    glow: "rgba(223, 239, 186, 0.22)",
  },
  {
    robe: "#564775",
    robeShade: "#302645",
    trim: "#f1efe9",
    accent: "#0f7c78",
    accentShade: "#075450",
    hair: "#19161c",
    hairShade: "#51475d",
    skin: "#d9a184",
    skinShade: "#b9755e",
    glow: "rgba(196, 184, 240, 0.26)",
  },
];

const JUDGE_PALETTE: Palette = {
  robe: "#3d2028",
  robeShade: "#241116",
  trim: "#d8b461",
  accent: "#4f6460",
  accentShade: "#2a3f3c",
  hair: "#161718",
  hairShade: "#3f4041",
  skin: "#d8a07a",
  skinShade: "#b17358",
  glow: "rgba(244, 216, 120, 0.28)",
};

function paletteFor(seed: string, role: CourtCharacterRole): Palette {
  if (role === "judge") return JUDGE_PALETTE;
  return PARTICIPANT_PALETTES[hashSeed(seed) % PARTICIPANT_PALETTES.length] ?? PARTICIPANT_PALETTES[0];
}

function poseFor(seed: string, role: CourtCharacterRole): CourtPose {
  if (role === "judge") return "gavel";
  return hashSeed(seed) % 2 === 0 ? "scroll" : "open-hand";
}

function adornmentFor(seed: string, role: CourtCharacterRole): CourtAdornment {
  if (role === "judge") return "crown";
  return hashSeed(seed) % 2 === 0 ? "bun" : "loose";
}

export function buildCourtCharacterAppearance(seed: string, role: CourtCharacterRole) {
  const palette = paletteFor(seed, role);
  return {
    pose: poseFor(seed, role),
    adornment: adornmentFor(seed, role),
    style: {
      "--court-robe": palette.robe,
      "--court-robe-shade": palette.robeShade,
      "--court-trim": palette.trim,
      "--court-accent": palette.accent,
      "--court-accent-shade": palette.accentShade,
      "--court-hair": palette.hair,
      "--court-hair-shade": palette.hairShade,
      "--court-skin": palette.skin,
      "--court-skin-shade": palette.skinShade,
      "--court-glow": palette.glow,
    } as CSSProperties,
  };
}

export function buildCourtPortraitMeta(role: CourtCharacterRole, label: string) {
  if (role === "judge") {
    return {
      ribbon: "秉衡",
      emblem: "衡",
      tone: "gold" as CourtSigilTone,
      title: label || "审判长",
    };
  }

  if (role === "speaker") {
    return {
      ribbon: "主辩",
      emblem: "辞",
      tone: "crimson" as CourtSigilTone,
      title: label || "当前陈词者",
    };
  }

  return {
    ribbon: "旁听",
    emblem: "听",
    tone: "jade" as CourtSigilTone,
    title: label || "列席",
  };
}
