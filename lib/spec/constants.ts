/** 圆桌与平台自保上限（与规划 M0 对齐，可调） */
export const MAX_ROUND_ROUNDS = 8;
export const MAX_CONCURRENT_STREAMS_PER_USER = 2;

/** 辩论模式：单轮发言上限 = 列席数 × 此系数 */
export const MAX_DEBATE_TURNS_FACTOR = 2;

/** API 请求体与圆桌状态字段上限（防 DoS / 异常大上下文） */
export const MAX_JSON_BODY_BYTES = 1_800_000;
export const MAX_TOPIC_LENGTH = 4_000;
export const MAX_MODERATOR_MEMORY_CHARS = 48_000;
export const MAX_SYNTHESIS_CHARS = 200_000;
export const MAX_ERROR_STRING_CHARS = 8_000;
export const MAX_TRANSCRIPT_ENTRIES = 400;
export const MAX_TRANSCRIPT_ENTRY_CHARS = 80_000;
export const MAX_CONTENT_HASH_SNAPSHOT_CHARS = 128;
export const MAX_PARTICIPANT_SKILL_IDS = 24;
export const MAX_SKILL_ID_LENGTH = 160;
export const MAX_SKILL_NAMES_IN_SHARE = 64;
export const MAX_SKILL_NAME_VALUE_CHARS = 120;

/** BYOK：支持的执笔后端（与 DB check、砚台 UI 同步） */
export const BYOK_PROVIDERS = ["openai", "openrouter", "anthropic", "minimax", "kimi", "doubao"] as const;
export type ByokProvider = (typeof BYOK_PROVIDERS)[number];

export function isOpenAiCompatibleProvider(p: ByokProvider): boolean {
  return p !== "anthropic";
}

/** 各后端默认 API 根路径（OpenAI 兼容类末尾含 /v1 或厂商约定）；空串表示须由用户在砚台填写 */
export function defaultApiBaseUrl(provider: ByokProvider): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "minimax":
      return "https://api.minimax.chat/v1";
    case "kimi":
      return "https://api.moonshot.cn/v1";
    case "doubao":
      return "https://ark.cn-beijing.volces.com/api/v3";
    case "anthropic":
      return "";
    default:
      return "";
  }
}

/** 砚台展示用短名（避免堆栈名，仍可辨认） */
export const PROVIDER_LABEL: Record<ByokProvider, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
  minimax: "MiniMax",
  kimi: "Kimi（月之暗面）",
  doubao: "豆包（火山方舟）",
};

export const DEFAULT_OPENAI_MODEL = "gpt-5.4";
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6-20250217";

/** 各 BYOK 后端的默认旗舰模型（用户未指定时使用） */
export const DEFAULT_MODEL_BY_PROVIDER: Record<ByokProvider, string> = {
  openai: DEFAULT_OPENAI_MODEL,
  anthropic: DEFAULT_ANTHROPIC_MODEL,
  openrouter: "anthropic/claude-sonnet-4-6",
  minimax: "MiniMax-M2.7",
  kimi: "kimi-k2.5",
  doubao: "doubao-2.0-pro",
};
