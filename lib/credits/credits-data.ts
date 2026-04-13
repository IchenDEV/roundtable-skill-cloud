export type RepoCredit = {
  skillId: string;
  label: string;
  source: string;
  repo: string;
};

const ALCHAINCYF = "https://github.com/alchaincyf";

export const ROUNDTABLE_INSPIRATION = "https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-roundtable";
export const SUPERMAN_REPO = "https://github.com/IchenDEV/superman";
export const AWESOME_PERSONA_REPO = "https://github.com/xixu-me/awesome-persona-distill-skills";
export const NUWA_REPO = "https://github.com/alchaincyf/nuwa-skill";

export const COMMUNITY_IMPORTS: RepoCredit[] = [
  {
    skillId: "paul-graham-perspective",
    label: "Paul Graham",
    source: "alchaincyf",
    repo: `${ALCHAINCYF}/paul-graham-skill`,
  },
  { skillId: "elon-musk-perspective", label: "马斯克", source: "alchaincyf", repo: `${ALCHAINCYF}/elon-musk-skill` },
  { skillId: "steve-jobs-perspective", label: "乔布斯", source: "alchaincyf", repo: `${ALCHAINCYF}/steve-jobs-skill` },
  { skillId: "feynman-perspective", label: "费曼", source: "alchaincyf", repo: `${ALCHAINCYF}/feynman-skill` },
  { skillId: "munger-perspective", label: "芒格", source: "alchaincyf", repo: `${ALCHAINCYF}/munger-skill` },
  { skillId: "naval-perspective", label: "纳瓦尔", source: "alchaincyf", repo: `${ALCHAINCYF}/naval-skill` },
  { skillId: "taleb-perspective", label: "塔勒布", source: "alchaincyf", repo: `${ALCHAINCYF}/taleb-skill` },
  { skillId: "trump-perspective", label: "特朗普", source: "alchaincyf", repo: `${ALCHAINCYF}/trump-skill` },
  { skillId: "mrbeast-perspective", label: "MrBeast", source: "alchaincyf", repo: `${ALCHAINCYF}/mrbeast-skill` },
  {
    skillId: "andrej-karpathy-perspective",
    label: "卡帕西",
    source: "alchaincyf",
    repo: `${ALCHAINCYF}/karpathy-skill`,
  },
  {
    skillId: "ilya-sutskever-perspective",
    label: "Ilya Sutskever",
    source: "alchaincyf",
    repo: `${ALCHAINCYF}/ilya-sutskever-skill`,
  },
  {
    skillId: "zhang-yiming-perspective",
    label: "张一鸣",
    source: "alchaincyf",
    repo: `${ALCHAINCYF}/zhang-yiming-skill`,
  },
  {
    skillId: "zhangxuefeng-perspective",
    label: "张雪峰",
    source: "alchaincyf",
    repo: `${ALCHAINCYF}/zhangxuefeng-skill`,
  },
  {
    skillId: "warren-buffett-perspective",
    label: "巴菲特",
    source: "will2025btc",
    repo: "https://github.com/will2025btc/buffett-perspective",
  },
  {
    skillId: "karl-marx-perspective",
    label: "马克思",
    source: "baojiachen0214",
    repo: "https://github.com/baojiachen0214/karlmarx-skill",
  },
];

export const LOCAL_MAINTAINED: Array<{ skillId: string; label: string }> = [];

export function formatSkillCount(count: number) {
  return `${count} 个`;
}

export function isFromSource(dirPath: string, prefix: string) {
  return dirPath === prefix || dirPath.startsWith(`${prefix}/`);
}

export function toSkillLabel(skillId: string) {
  return skillId.replace(/-perspective$/, "").replaceAll("-", " ");
}
