export type HomeQuickStartExample = {
  label: string;
  tone: string;
  topic: string;
  skillIds: string[];
  maxRounds?: number;
};

export const HOME_QUICKSTART_EXAMPLES: HomeQuickStartExample[] = [
  {
    label: "科技与人",
    tone: "卡帕西、伊利亚、费曼同席，适合把技术判断与主体性问题一起谈透。",
    topic: "人工智能是否会削弱人的主体性？",
    skillIds: ["andrej-karpathy-perspective", "ilya-sutskever-perspective", "feynman-perspective"],
    maxRounds: 3,
  },
  {
    label: "工作与选择",
    tone: "纳瓦尔、保罗·格雷厄姆、王阳明同席，适合把现实选择与内在动机并看。",
    topic: "长期待在舒适区，是清醒还是逃避？",
    skillIds: ["naval-perspective", "paul-graham-perspective", "wangyangming-perspective"],
    maxRounds: 3,
  },
  {
    label: "公共讨论",
    tone: "张一鸣、塔勒布、苏格拉底同席，适合同时审视传播、风险与追问方式。",
    topic: "公共议题的讨论，更需要理性还是共情？",
    skillIds: ["zhang-yiming-perspective", "taleb-perspective", "socrates-perspective"],
    maxRounds: 3,
  },
];

export function filterAvailableSkillIds(skillIds: string[], availableSkillIds: Iterable<string>): string[] {
  const available = new Set(availableSkillIds);
  return skillIds.filter((skillId) => available.has(skillId));
}

export function buildRoundtableHref({
  topic,
  skillIds,
  maxRounds,
}: {
  topic?: string;
  skillIds?: string[];
  maxRounds?: number;
}): string {
  const params = new URLSearchParams();
  const normalizedTopic = topic?.trim();
  const normalizedSkillIds = Array.from(new Set((skillIds ?? []).map((skillId) => skillId.trim()).filter(Boolean)));

  if (normalizedTopic) params.set("topic", normalizedTopic);
  if (normalizedSkillIds.length > 0) params.set("skills", normalizedSkillIds.join(","));
  if (Number.isFinite(maxRounds) && maxRounds && maxRounds >= 1) params.set("maxRounds", String(Math.floor(maxRounds)));

  const query = params.toString();
  return query ? `/roundtable?${query}` : "/roundtable";
}
