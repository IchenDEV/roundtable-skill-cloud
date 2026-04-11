import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

import type { LlmRuntime } from "./types";

export function toLangChainModel(runtime: LlmRuntime, model: string): BaseChatModel {
  switch (runtime.kind) {
    case "anthropic":
      return new ChatAnthropic({ apiKey: runtime.apiKey, model, temperature: 0, maxTokens: 8192 });
    case "openai_compat":
      return new ChatOpenAI({
        apiKey: runtime.apiKey,
        model,
        temperature: 0,
        maxTokens: 8192,
        configuration: { baseURL: runtime.baseURL },
      });
  }
}
