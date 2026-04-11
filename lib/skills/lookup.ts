import type { SkillManifest } from "./types";

export function getSkillById(manifest: SkillManifest, id: string): SkillManifest["skills"][0] | undefined {
  return manifest.skills.find((s) => s.skillId === id);
}
