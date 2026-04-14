export type SkillEntry = {
  skillId: string;
  name: string;
  description: string;
  displayName?: string;
  displayBrief?: string;
  contentHash: string;
  dirPath: string;
  entryPath: string;
  category: string;
};

export type SkillManifest = {
  generatedAt: string;
  skills: SkillEntry[];
};
