import Link from "next/link";
import type { Metadata } from "next";
import { CreditsRepoTable } from "@/components/credits/credits-repo-table";
import { CreditsSkillPills } from "@/components/credits/credits-skill-pills";
import {
  AWESOME_PERSONA_REPO,
  COMMUNITY_IMPORTS,
  formatSkillCount,
  isFromSource,
  LOCAL_MAINTAINED,
  NUWA_REPO,
  ROUNDTABLE_INSPIRATION,
  SUPERMAN_REPO,
  toSkillLabel,
} from "@/lib/credits/credits-data";
import { loadSkillManifest } from "@/lib/skills/load-manifest";

export const metadata: Metadata = { title: "致谢 · 圆桌" };

export default function CreditsPage() {
  const manifest = loadSkillManifest();
  const externalSkills = manifest.skills.filter((skill) => isFromSource(skill.dirPath, "skills-superman/skills"));
  const localSkills = manifest.skills.filter((skill) => isFromSource(skill.dirPath, "skills"));
  const activeCommunityImports = COMMUNITY_IMPORTS.filter((credit) =>
    localSkills.some((skill) => skill.skillId === credit.skillId)
  );
  const activeLocalMaintained = LOCAL_MAINTAINED.filter((credit) =>
    localSkills.some((skill) => skill.skillId === credit.skillId)
  );
  const coveredLocalSkillIds = new Set([
    ...activeCommunityImports.map((credit) => credit.skillId),
    ...activeLocalMaintained.map((credit) => credit.skillId),
  ]);
  const localSkillLabels = [
    ...activeLocalMaintained.map((skill) => skill.label),
    ...localSkills
      .filter((skill) => !coveredLocalSkillIds.has(skill.skillId))
      .map((skill) => toSkillLabel(skill.skillId)),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header>
        <h1 className="font-serif text-2xl tracking-[0.15em] text-ink-900">致谢</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          圆桌的「人格蒸馏
          Skill」并非凭空而来。它们一部分来自开源社区的慷慨分享，一部分由本仓持续维护与扩写。本页按当前运行时 manifest
          列出真实来源，尽量把灵感、标准与署名说清楚。
        </p>
      </header>
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">产品灵感</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          「圆桌」的多 Skill 列席、主持控场、结案合成这一产品形态，最初受到
          <a
            href={ROUNDTABLE_INSPIRATION}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            lijigang/ljg-roundtable
          </a>
          的启发。在此基础上，我们将其扩展为逐回合流式编排、泳道时间线、席间插话与旧席复刻等完整的 Web 产品。
        </p>
      </section>
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">当前来源</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          运行时 Skill manifest 当前共收录 {formatSkillCount(manifest.skills.length)} Skill。其中
          <span className="mx-1 font-medium text-ink-900">{formatSkillCount(externalSkills.length)}</span>
          来自外部视角库，
          <span className="mx-1 font-medium text-ink-900">{formatSkillCount(localSkills.length)}</span>
          由本仓维护。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-card px-5 py-4 ring-border">
            <p className="text-xs tracking-[0.14em] text-ink-500">外部视角库</p>
            <p className="mt-2 font-serif text-lg text-ink-900">skills-superman / superman</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              由
              <a
                href={SUPERMAN_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-1 text-cinnabar-700 underline underline-offset-2"
              >
                IchenDEV/superman
              </a>
              子模块提供，当前启用 {formatSkillCount(externalSkills.length)} Skill。
            </p>
          </div>
          <div className="rounded-2xl bg-card px-5 py-4 ring-border">
            <p className="text-xs tracking-[0.14em] text-ink-500">蒸馏标准</p>
            <p className="mt-2 font-serif text-lg text-ink-900">Nuwa / 女娲造人</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              多数人格蒸馏方法、结构模板与研究范式受到
              <a
                href={NUWA_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-1 text-cinnabar-700 underline underline-offset-2"
              >
                alchaincyf/nuwa-skill
              </a>
              的影响。
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">社区作者与仓库</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          以下本仓维护中的视角，直接整理、适配或延续自社区公开仓库。其中相当一部分也被
          <a
            href={AWESOME_PERSONA_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            awesome-persona-distill-skills
          </a>
          收录。
        </p>
        <CreditsRepoTable rows={activeCommunityImports} />
      </section>
      <section>
        <h2 className="font-serif text-lg tracking-[0.12em] text-ink-900">本仓维护与扩写</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          以下视角由本仓直接维护，或在公开材料基础上转写、补全并接入圆桌运行时。
        </p>
        <CreditsSkillPills labels={localSkillLabels} />
      </section>
      <section className="pt-6 divider-t">
        <p className="text-xs leading-relaxed text-ink-600">
          上述 Skill 遵循各自原始仓库或本仓声明的许可与署名约束。圆桌对其进行了格式适配、YAML frontmatter
          规范化与运行时接线；最终以 `.generated/skills-manifest.json` 中实际启用的来源为准。如有遗漏或错误，请
          <a
            href="https://github.com/IchenDEV/roundtable-skill-cloud/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-cinnabar-700 underline underline-offset-2"
          >
            提交 issue
          </a>
          告知。
        </p>
      </section>
      <div className="pt-2 text-center">
        <Link href="/" className="text-sm text-ink-600 transition-colors hover:text-cinnabar-600">
          ← 返回序页
        </Link>
      </div>
    </div>
  );
}
