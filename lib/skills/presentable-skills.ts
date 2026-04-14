import type { SkillEntry, SkillManifest } from "./types";

export type SkillSummary = {
  skillId: string;
  name: string;
  description: string;
  category: string;
  contentHash?: string;
};

export function toSkillDisplay(skill: Pick<SkillEntry, "skillId" | "name" | "displayName" | "displayBrief">) {
  return {
    label: skill.displayName?.trim() || skill.name || skill.skillId,
    brief: skill.displayBrief?.trim() || "",
  };
}

export function toSkillSummary(skill: SkillEntry): SkillSummary {
  return {
    skillId: skill.skillId,
    name: skill.displayName?.trim() || skill.name || skill.skillId,
    description: skill.displayBrief?.trim() || skill.description,
    category: skill.category,
    contentHash: skill.contentHash,
  };
}

export function toSkillSummaries(manifest: SkillManifest): SkillSummary[] {
  return manifest.skills.map(toSkillSummary);
}
