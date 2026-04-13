import Link from "next/link";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import { buildRoundtableHref, filterAvailableSkillIds, HOME_QUICKSTART_EXAMPLES } from "@/lib/home/home-quick-start";

export function HomeExamples({ availableSkillIds }: { availableSkillIds: string[] }) {
  const available = new Set(availableSkillIds);
  return (
    <section className="mt-20 w-full border-t border-ink-200/50 pt-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-500">开席题引</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[0.15em] text-ink-900">先借一问起势</h2>
          <p className="mt-3 text-sm leading-7 text-ink-700">
            点选一则即可带着预置人物入席，议题与列席会自动带入圆桌，你仍可在开谈前继续改写。
          </p>
        </div>
        <div className="text-sm text-ink-600">不知道怎么起笔时，先借题再借一桌人，开局会轻很多。</div>
      </div>
      <ul className="mt-6 grid gap-4 text-left text-sm md:grid-cols-3">
        {HOME_QUICKSTART_EXAMPLES.map((example) => {
          const preparedSkillIds = filterAvailableSkillIds(example.skillIds, available);
          const preparedLabels = preparedSkillIds.map((skillId) => getSkillDisplay(skillId).label);
          return (
            <li key={example.label}>
              <Link
                href={buildRoundtableHref({
                  topic: example.topic,
                  skillIds: preparedSkillIds,
                  maxRounds: example.maxRounds,
                })}
                className="group block h-full rounded-[1.5rem] bg-card/90 px-5 py-5 font-sans text-ink-800 shadow-[0_0_0_1px_var(--border),rgba(0,0,0,0.05)_0px_8px_28px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--cinnabar),rgba(20,20,19,0.08)_0px_16px_40px] hover:text-cinnabar-600 active:scale-[0.995]"
              >
                <span className="inline-flex rounded-full border border-ink-200/70 px-3 py-1 text-xs text-ink-600 transition-colors duration-200 group-hover:border-cinnabar-600/40 group-hover:text-cinnabar-700">
                  {example.label}
                </span>
                <span className="mt-4 block text-base leading-7 text-ink-900">{example.topic}</span>
                <span className="mt-3 block text-xs leading-6 text-ink-600">{example.tone}</span>
                <span className="mt-4 block text-[11px] tracking-[0.24em] text-ink-500">
                  {preparedLabels.length > 0 ? "预置列席" : "入席后可自选人物"}
                </span>
                {preparedLabels.length > 0 && (
                  <span className="mt-3 flex flex-wrap gap-2">
                    {preparedLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-ink-200/70 bg-paper-50/90 px-3 py-1 text-xs text-ink-700 transition-colors duration-200 group-hover:border-cinnabar-600/35 group-hover:text-cinnabar-700"
                      >
                        {label}
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
