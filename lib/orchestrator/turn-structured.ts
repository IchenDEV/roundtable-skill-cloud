export type SpeakerStructured = {
  stance?: string;
  confidence?: "low" | "medium" | "high";
  evidenceTendency?: string;
  styleCard?: string;
  conflictPoints?: string[];
};

function inferConfidence(text: string): "low" | "medium" | "high" {
  if (/(铁证|必然|毫无疑问|可以断言|确定)/.test(text)) return "high";
  if (/(或许|可能|倾向于|未必|尚待)/.test(text)) return "low";
  return "medium";
}

function inferEvidenceTendency(text: string): string {
  if (/(数据|样本|实验|统计|测量)/.test(text)) return "数据实证";
  if (/(案例|经验|田野|访谈|观察)/.test(text)) return "案例经验";
  if (/(定义|概念|范式|前提|逻辑)/.test(text)) return "概念推演";
  return "综合论证";
}

function inferStyleCard(text: string): string {
  if (/(必须|立刻|当场|马上)/.test(text)) return "进攻裁断";
  if (/(拆开|分层|先.*再|其一|其二)/.test(text)) return "分层析理";
  if (/(如果|一旦|否则|风险)/.test(text)) return "条件预警";
  return "稳健陈述";
}

function pickStance(text: string): string | undefined {
  const concise = text.match(/\*\*简言之\*\*[:：]\s*([^\n]+)/)?.[1]?.trim();
  if (concise) return concise.slice(0, 120);
  const firstSentence = text
    .split(/[。！？\n]/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstSentence?.slice(0, 120);
}

function inferConflictPoints(text: string): string[] {
  const points = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && /(不同意|反对|漏洞|回避|误判|偏差|驳)/.test(line))
    .slice(0, 3)
    .map((line) => line.slice(0, 80));
  return Array.from(new Set(points));
}

export function deriveSpeakerStructured(text: string): SpeakerStructured {
  return {
    stance: pickStance(text),
    confidence: inferConfidence(text),
    evidenceTendency: inferEvidenceTendency(text),
    styleCard: inferStyleCard(text),
    conflictPoints: inferConflictPoints(text),
  };
}

export function deriveRoundSection(text: string, title: string, skillIds: string[]) {
  const rx = new RegExp(
    `(?:^|\\n)(?:#+\\s*)?${title}[：:]?\\s*\\n?([\\s\\S]*?)(?=\\n(?:#+\\s*)?(?:共识|分歧|待证据补强)|$)`
  );
  const body = text.match(rx)?.[1]?.trim();
  if (!body) return undefined;
  const used = skillIds.filter((id) => new RegExp(id, "i").test(body));
  return { text: body.slice(0, 600), skillIds: used };
}
