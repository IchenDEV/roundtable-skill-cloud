import { getSkillDisplay } from "@/lib/skills/skill-display";

type SkillRow = { skillId: string; name: string; description: string; category: string };

const CATEGORY_ORDER = ["商业投资", "科技理工", "哲学思想", "政治治国", "军事战略", "谋略纵横", "其他"];

function orderCategories(a: string, b: string) {
  const aIndex = CATEGORY_ORDER.indexOf(a);
  const bIndex = CATEGORY_ORDER.indexOf(b);

  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "zh-Hans-CN");
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;

  return aIndex - bIndex;
}

export function HomeSkillIntro({ skills }: { skills: SkillRow[] }) {
  if (skills.length === 0) {
    return (
      <section className="mx-auto mt-16 max-w-2xl border-t border-ink-200/40 pt-12 text-sm text-ink-600">
        内置视角名录暂未载入，请稍后再看序页或联系维护者。
      </section>
    );
  }

  const groupedSkills = new Map<string, SkillRow[]>();
  for (const skill of skills) {
    const category = skill.category || "其他";
    const existing = groupedSkills.get(category);
    if (existing) {
      existing.push(skill);
      continue;
    }
    groupedSkills.set(category, [skill]);
  }

  const orderedGroups = Array.from(groupedSkills.entries())
    .sort(([left], [right]) => orderCategories(left, right))
    .map(([category, entries]) => ({
      category,
      anchor: `category-${category}`,
      entries: entries.toSorted((left, right) => {
        const leftDisplay = getSkillDisplay(left.skillId);
        const rightDisplay = getSkillDisplay(right.skillId);
        return leftDisplay.label.localeCompare(rightDisplay.label, "zh-Hans-CN");
      }),
    }));

  return (
    <section className="mx-auto mt-20 max-w-5xl border-t border-ink-200/50 pt-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.32em] text-ink-500">人物卷册</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[0.15em] text-ink-900">可入席的人物，按门类排开</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
            每位人物都携带独立的思维框架与表达风格。你不必先认识所有人，只要先从门类入手，再挑几位互相掣肘、互相照见的人物即可。
          </p>
        </div>
        <div className="rounded-full border border-ink-200/70 bg-card/80 px-4 py-2 text-sm text-ink-600">
          共 {skills.length} 位人物，分作 {orderedGroups.length} 门
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {orderedGroups.map((group) => (
          <a
            key={group.category}
            href={`#${group.anchor}`}
            className="rounded-full border border-ink-200/70 bg-card/85 px-4 py-2 text-sm text-ink-700 transition-colors duration-200 hover:border-cinnabar-600/40 hover:text-cinnabar-700"
          >
            {group.category}
            <span className="ml-2 text-ink-500">{group.entries.length}</span>
          </a>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {orderedGroups.map((group) => (
          <section
            key={group.category}
            id={group.anchor}
            className="rounded-[1.75rem] border border-ink-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.16))] px-5 py-5 shadow-[0_16px_48px_rgba(20,20,19,0.05)] md:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200/70 pb-4">
              <div>
                <h3 className="font-serif text-xl tracking-[0.12em] text-ink-900">{group.category}</h3>
                <p className="mt-1 text-sm text-ink-600">从这一门里挑几位，最适合快速起一桌有分寸的讨论。</p>
              </div>
              <div className="rounded-full bg-paper-100/70 px-3 py-1 text-xs tracking-[0.2em] text-ink-600">
                {group.entries.length} 位人物
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.entries.map((skill) => {
                const display = getSkillDisplay(skill.skillId);
                return (
                  <div
                    key={skill.skillId}
                    className="rounded-2xl bg-card/90 px-4 py-4 shadow-[0_0_0_1px_var(--border)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--cinnabar),rgba(20,20,19,0.08)_0px_16px_30px]"
                  >
                    <h4 className="text-sm font-medium text-ink-900">{display.label}</h4>
                    <p className="mt-2 text-xs leading-6 text-ink-600">{display.brief || skill.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
