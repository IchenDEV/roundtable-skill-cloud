/** 圆桌与平台自保上限（与规划 M0 对齐，可调） */
export const MAX_ROUND_ROUNDS = 8;
export const MAX_SPEAKERS_PER_ROUND_PARALLEL = 1;
export const MAX_DAILY_REQUESTS_PER_USER = 500;
export const MAX_CONCURRENT_STREAMS_PER_USER = 2;

/** BYOK：支持的执笔后端（与 DB check、砚台 UI 同步） */
export const BYOK_PROVIDERS = ["openai", "openrouter", "anthropic", "minimax", "kimi", "doubao"] as const;
export type ByokProvider = (typeof BYOK_PROVIDERS)[number];

/** 使用 OpenAI 兼容 HTTP 形态（OpenAI SDK + baseURL） */
export const OPENAI_COMPAT_PROVIDERS: ByokProvider[] = ["openai", "openrouter", "minimax", "kimi", "doubao"];

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

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

/** 动效：必选（状态变化）vs 可选（装饰）；reduced-motion 时仅保留必选 */
export const MOTION_REQUIRED = ["focus-ring", "loading-spinner", "route-fade"] as const;
export const MOTION_OPTIONAL = [
  "ink-reveal",
  "lane-stagger",
  "seal-stamp",
  "sidebar-slide",
  "scroll-parallax",
] as const;

/** 数据生命周期：MVP 直至用户删除；预留自动过期 */
export const DEFAULT_RETENTION_DAYS: number | null = null;
