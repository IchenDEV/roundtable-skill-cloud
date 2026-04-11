import { getSkillDisplay } from "@/lib/skills/skill-display";

type SkillRow = { skillId: string; name: string; description: string };

export function HomeSkillIntro({ skills }: { skills: SkillRow[] }) {
  if (skills.length === 0) {
    return (
      <section className="mx-auto mt-12 max-w-2xl border-t border-ink-200/40 pt-10 text-sm text-ink-600">
        内置视角名录暂未载入，请稍后再看序页或联系维护者。
      </section>
    );
  }

  return (
    <section className="mx-auto mt-12 max-w-3xl border-t border-ink-200/40 pt-10">
      <h2 className="font-serif text-lg tracking-[0.15em] text-ink-900">可入席的视角</h2>
      <p className="mt-2 text-sm text-ink-700">
        每位「视角」携带独立的思维框架与表达风格，入席后以第一人称回应主持与他席。
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {skills.map((s) => {
          const d = getSkillDisplay(s.skillId);
          return (
            <div
              key={s.skillId}
              className="rounded-lg border border-ink-200/40 bg-paper-100/20 px-3 py-2.5 transition-colors hover:border-gold-500/50 hover:bg-paper-100/50"
            >
              <h3 className="text-sm font-medium text-ink-900">{d.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{d.brief}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
