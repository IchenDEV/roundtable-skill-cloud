import manifestJson from "@/.generated/skills-manifest.json";
import type { SkillManifest } from "./types";
import { toSkillDisplay } from "./presentable-skills";

const manifest = manifestJson as SkillManifest;

/** Human-friendly display metadata sourced from the generated skill manifest. */
export const SKILL_DISPLAY: Record<string, { label: string; brief: string }> = Object.fromEntries(
  manifest.skills.map((skill) => [skill.skillId, toSkillDisplay(skill)])
);

export function getSkillDisplay(skillId: string): { label: string; brief: string } {
  return SKILL_DISPLAY[skillId] ?? { label: skillId, brief: "" };
}
