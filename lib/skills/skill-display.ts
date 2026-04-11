/** Human-friendly display metadata for skills (Chinese names + short descriptions) */
export const SKILL_DISPLAY: Record<string, { label: string; brief: string }> = {
  "paul-graham-perspective": { label: "保罗·格雷厄姆", brief: "YC 创始人，创业、写作与产品哲学" },
  "zhang-yiming-perspective": { label: "张一鸣", brief: "字节跳动创始人，产品、组织与全球化" },
  "andrej-karpathy-perspective": { label: "卡帕西", brief: "AI 工程师，深度学习与技术教育" },
  "ilya-sutskever-perspective": { label: "伊利亚", brief: "AI 安全先驱，scaling 与研究品味" },
  "mrbeast-perspective": { label: "MrBeast", brief: "YouTube 之王，内容创造方法论" },
  "trump-perspective": { label: "特朗普", brief: "谈判、权力博弈与传播策略" },
  "steve-jobs-perspective": { label: "乔布斯", brief: "苹果创始人，产品设计与战略" },
  "elon-musk-perspective": { label: "马斯克", brief: "第一性原理，工程与成本拆解" },
  "munger-perspective": { label: "芒格", brief: "多元思维模型，投资与逆向思考" },
  "feynman-perspective": { label: "费曼", brief: "物理学家，学习方法与科学思维" },
  "naval-perspective": { label: "纳瓦尔", brief: "杠杆、特定知识与财富哲学" },
  "taleb-perspective": { label: "塔勒布", brief: "反脆弱、黑天鹅与风险管理" },
  "zhangxuefeng-perspective": { label: "张雪峰", brief: "教育选择、职业规划与阶层流动" },
  "legalist-perspective": { label: "法家", brief: "信赏必罚，规则与激励结构" },
  "sage-perspective": { label: "道家", brief: "无为守柔，顺势与反身思考" },
  "drucker-perspective": { label: "德鲁克", brief: "管理学之父，组织效能与知识工作者" },
  "karl-marx-perspective": { label: "马克思", brief: "结构分析、矛盾分析与实践检验" },
  "laozi-perspective": { label: "老子", brief: "道法自然，反身观照与柔弱胜刚" },
  "miyamoto-perspective": { label: "宫本茂", brief: "任天堂，游戏设计与交互体验" },
  "wangyangming-perspective": { label: "王阳明", brief: "知行合一，致良知与心学实践" },
  "warren-buffett-perspective": { label: "巴菲特", brief: "价值投资，能力圈与长期主义" },
};

export function getSkillDisplay(skillId: string): { label: string; brief: string } {
  return SKILL_DISPLAY[skillId] ?? { label: skillId, brief: "" };
}
