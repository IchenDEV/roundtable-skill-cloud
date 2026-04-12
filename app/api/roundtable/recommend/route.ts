import { z } from "zod";
import { resolveLlm } from "@/lib/server/resolve-llm";
import { chatComplete } from "@/lib/llm/stream-chat";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { getSkillDisplay } from "@/lib/skills/skill-display";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  availableSkillIds: z.array(z.string().max(80)).min(1).max(100),
});

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

  const prompt = `你是一个圆桌讨论主持人。用户想讨论以下话题：

"${safeTopic}"

以下是所有可选人物（格式：skillId: 姓名（简介））：
${roster}

请从中选出最适合讨论这个话题的 3 到 5 位人物。只返回一个 JSON 数组，包含对应的 skillId 字符串，不要任何其他文字。例如：["sun-wu-perspective","plato-perspective"]`;

  try {
    const text = (await chatComplete(llm.runtime, llm.model, [{ role: "user", content: prompt }])).trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json({ error: "推荐引擎返回格式异常，请重试。" }, { status: 422 });
    }

    if (!Array.isArray(parsed)) {
      return Response.json({ error: "推荐引擎返回格式异常，请重试。" }, { status: 422 });
    }

    const validSet = new Set(availableSkillIds);
    const recommendedSkillIds = (parsed as unknown[])
      .filter((x): x is string => typeof x === "string" && validSet.has(x))
      .slice(0, 5);

    if (recommendedSkillIds.length === 0) {
      return Response.json({ error: "推荐引擎未能找到合适人物，请手动选择。" }, { status: 422 });
    }

    return Response.json({ recommendedSkillIds });
  } catch {
    return Response.json({ error: "推荐引擎调用失败，请重试。" }, { status: 500 });
  }
}
