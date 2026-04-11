export type SkillEntry = {
  skillId: string;
  name: string;
  description: string;
  contentHash: string;
  dirPath: string;
  entryPath: string;
};

export type SkillManifest = {
  generatedAt: string;
  skills: SkillEntry[];
};
