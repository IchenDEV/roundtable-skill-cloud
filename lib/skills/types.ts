export type SkillEntry = {
  skillId: string;
  name: string;
  description: string;
  contentHash: string;
  /** 注入模型的 system 片段（可截断） */
  compiledPrompt: string;
  rawPath: string;
};

export type SkillManifest = {
  generatedAt: string;
  skills: SkillEntry[];
};
