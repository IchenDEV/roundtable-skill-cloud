import { z } from "zod";
import { resolveLlm } from "@/lib/server/resolve-llm";
import { chatComplete, chatToolCall, type Msg } from "@/lib/llm/stream-chat";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { getSkillDisplay } from "@/lib/skills/skill-display";

export const runtime = "nodejs";
export const maxDuration = 30;

const RECOMMEND_TOOL_NAME = "recommend_skill_ids";
const RECOMMEND_TOOL_DESCRIPTION = "从候选人物中挑选最适合当前议题入席的 3 到 5 个 skillId。";

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  availableSkillIds: z.array(z.string().max(80)).min(1).max(100),
});

function parseJsonSnippet(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidates = [
    trimmed,
    fenced?.[1],
    trimmed.match(/\[[\s\S]*\]/)?.[0],
    trimmed.match(/\{[\s\S]*\}/)?.[0],
  ].filter((candidate): candidate is string => Boolean(candidate?.trim()));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function coerceSkillIdList(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is string => typeof item === "string");
  }

  if (typeof payload === "string") {
    return coerceSkillIdList(parseJsonSnippet(payload));
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    return coerceSkillIdList(record.recommendedSkillIds ?? record.skillIds ?? record.recommended_skill_ids ?? null);
  }

  return [];
}

function normalizeRecommendedSkillIds(payload: unknown, availableSkillIds: string[]): string[] {
  const validSet = new Set(availableSkillIds);
  const seen = new Set<string>();
  const selected: string[] = [];

  for (const skillId of coerceSkillIdList(payload)) {
    if (!validSet.has(skillId) || seen.has(skillId)) continue;
    seen.add(skillId);
    selected.push(skillId);
    if (selected.length >= 5) break;
  }

  return selected;
}

function hasRecommendationShape(payload: unknown): boolean {
  if (Array.isArray(payload)) return true;
  if (typeof payload === "string") return hasRecommendationShape(parseJsonSnippet(payload));
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return "recommendedSkillIds" in record || "skillIds" in record || "recommended_skill_ids" in record;
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const { topic, availableSkillIds } = body.data;

  let llm: Awaited<ReturnType<typeof resolveLlm>>;
  try {
    llm = await resolveLlm();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "推荐引擎初始化失败。";
    return Response.json({ error: msg }, { status: 503 });
  }

  const safeTopic = topic.replace(/[\x00-\x1f\x7f]/g, " ").trim();

  const roster = availableSkillIds
    .map((id) => {
      const d = getSkillDisplay(id);
      return `${id}: ${d.label}（${d.brief}）`;
    })
    .join("\n");

  const messages: Msg[] = [
    {
      role: "system",
      content: `你是圆桌讨论主持人。你必须只从给定候选人物中挑选 3 到 5 位入席，不得虚构 skillId，不得超出候选名单。优先覆盖互补视角，避免重复。`,
    },
    {
      role: "user",
      content: `议题如下：

"${safeTopic}"

候选人物（格式：skillId: 姓名（简介））：
${roster}`,
    },
  ];

  const recommendToolSchema = {
    type: "object" as const,
    properties: {
      recommendedSkillIds: {
        type: "array",
        description: "按推荐优先级排序的 skillId 列表",
        items: { type: "string", enum: availableSkillIds },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["recommendedSkillIds"],
    additionalProperties: false,
  };

  try {
    let raw: unknown = null;
    let fallbackRaw: unknown = null;
    try {
      const toolResult = await chatToolCall(
        llm.runtime,
        llm.model,
        messages,
        RECOMMEND_TOOL_NAME,
        recommendToolSchema,
        RECOMMEND_TOOL_DESCRIPTION
      );
      raw = toolResult.input ?? toolResult.text;
    } catch {
      const fallbackText = await chatComplete(llm.runtime, llm.model, [
        ...messages,
        {
          role: "user",
          content:
            '若你无法调用工具，则只返回一个 JSON 数组，包含候选 skillId 字符串，例如：["sun-wu-perspective","plato-perspective"]',
        },
      ]);
      fallbackRaw = fallbackText.trim();
      raw = fallbackRaw;
    }

    let recommendedSkillIds = normalizeRecommendedSkillIds(raw, availableSkillIds);
    if (recommendedSkillIds.length === 0) {
      const fallbackText = await chatComplete(llm.runtime, llm.model, [
        ...messages,
        {
          role: "user",
          content:
            '请仅输出 JSON。优先返回 {"recommendedSkillIds":["..."]}，也接受直接返回 skillId 数组；不要解释，不要 markdown 代码块。',
        },
      ]);
      fallbackRaw = fallbackText;
      recommendedSkillIds = normalizeRecommendedSkillIds(fallbackRaw, availableSkillIds);
    }

    if (recommendedSkillIds.length === 0) {
      const invalidShape = !hasRecommendationShape(raw) && !hasRecommendationShape(fallbackRaw);
      return Response.json(
        { error: invalidShape ? "推荐引擎返回格式异常，请重试。" : "推荐引擎未能找到合适人物，请手动选择。" },
        { status: 422 }
      );
    }

    return Response.json({ recommendedSkillIds });
  } catch {
    return Response.json({ error: "推荐引擎调用失败，请重试。" }, { status: 500 });
  }
}
