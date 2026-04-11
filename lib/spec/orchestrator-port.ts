import type { RoundtableState } from "./schema";
import type { SkillManifest } from "../skills/types";
import type { StreamEvent } from "./schema";
import type { ResolvedLlm } from "../llm/types";

/** 解析执笔运行时配置（多后端） */
export type OrchestratorLlmResolver = () => Promise<ResolvedLlm>;

export type RunRoundtableParams = {
  state: RoundtableState;
  manifest: SkillManifest;
  moderatorPrompt: string;
  resolveLlm: OrchestratorLlmResolver;
  model?: string;
  mode?: "graph" | "deepagent";
};

export type OrchestratorPort = {
  runRoundtable: (params: RunRoundtableParams) => AsyncGenerator<StreamEvent, RoundtableState>;
};
