import type { ByokProvider } from "../spec/constants";

export type LlmRuntime =
  | { kind: "openai_compat"; apiKey: string; baseURL: string; provider: ByokProvider }
  | { kind: "anthropic"; apiKey: string; provider: ByokProvider };

export type ResolvedLlm = {
  runtime: LlmRuntime;
  model: string;
};
