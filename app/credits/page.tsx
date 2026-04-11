import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "致谢 · 圆桌" };

type Credit = {
  skillId: string;
  label: string;
  source: string;
  repo: string;
};

const ALCHAINCYF = "https://github.com/alchaincyf";

const SKILL_CREDITS: Credit[] = [
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

const SELF_MADE = [
  { skillId: "drucker-perspective", label: "德鲁克" },
  { skillId: "laozi-perspective", label: "老子" },
  { skillId: "wangyangming-perspective", label: "王阳明" },
  { skillId: "miyamoto-perspective", label: "宫本茂" },
  { skillId: "sage-perspective", label: "道家" },
  { skillId: "legalist-perspective", label: "法家" },
];

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header>
        <h1 className="font-serif text-2xl tracking-[0.15em] text-ink-900">致谢</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          圆桌的「人格蒸馏 Skill」并非凭空而来——它们源于开源社区中多位作者的调研、整理与分享。
          本页列出每一个内置视角的出处，以志感念。
        </p>
      </header>

      {/* ── 产品灵感 ── */}
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">产品灵感</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          「圆桌」的多 Skill 列席、主持控场、结案合成这一产品形态，最初受到
          <a
            href="https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-roundtable"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            lijigang/ljg-roundtable
          </a>
          的启发。在此基础上，圆桌将其扩展为流式编排、泳道时间线、席间插话等完整的 Web 产品。
        </p>
      </section>

      {/* ── Skill 索引 ── */}
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">Skill 索引</h2>
        <p className="mt-2 text-sm text-ink-700">
          以下视角 Skill 的蒸馏框架与原始材料来自
          <a
            href="https://github.com/xixu-me/awesome-persona-distill-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            awesome-persona-distill-skills
          </a>
          收录的开源仓库，主要作者为
          <a
            href={ALCHAINCYF}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            alchaincyf
          </a>
          （花叔）。
        </p>

        <div className="mt-5 overflow-hidden rounded-md border border-ink-200/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200/40 bg-paper-100/50">
              <tr>
                <th className="px-4 py-2 font-medium text-ink-900">视角</th>
                <th className="px-4 py-2 font-medium text-ink-900">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/30">
              {SKILL_CREDITS.map((c) => (
                <tr key={c.skillId} className="transition-colors hover:bg-paper-100/40">
                  <td className="px-4 py-2 text-ink-800">{c.label}</td>
                  <td className="px-4 py-2">
                    <a
                      href={c.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-cinnabar-700 underline underline-offset-2"
                    >
                      {c.source}/{c.repo.split("/").pop()}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 自建视角 ── */}
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">项目自建视角</h2>
        <p className="mt-2 text-sm text-ink-700">
          以下视角由本项目维护者自行调研与编写，蒸馏流程 Powered by{" "}
          <a
            href="https://github.com/alchaincyf/nuwa-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cinnabar-700 underline underline-offset-2"
          >
            alchaincyf/nuwa-skill
          </a>
          （女娲造人）。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SELF_MADE.map((s) => (
            <span
              key={s.skillId}
              className="rounded-md border border-ink-200/50 bg-paper-100/30 px-3 py-1.5 text-sm text-ink-800"
            >
              {s.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── 许可说明 ── */}
      <section className="border-t border-ink-200/40 pt-6">
        <p className="text-xs leading-relaxed text-ink-600">
          上述各 Skill 遵循其原始仓库许可协议。圆桌对其进行了格式适配与 YAML frontmatter 规范化，
          原始版权与署名归各作者所有。如有遗漏或错误，请
          <a
            href="https://github.com/IchenDEV/roundtable-skill-cloud/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cinnabar-700 underline underline-offset-2"
          >
            提交 issue
          </a>
          告知。
        </p>
      </section>

      <div className="pt-2 text-center">
        <Link href="/" className="text-sm text-ink-600 transition-colors hover:text-cinnabar-700">
          ← 返回序页
        </Link>
      </div>
    </div>
  );
}
