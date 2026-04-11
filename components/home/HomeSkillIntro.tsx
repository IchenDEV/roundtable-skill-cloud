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
    <section className="mx-auto mt-12 max-w-2xl border-t border-ink-200/40 pt-10">
      <h2 className="font-serif text-lg tracking-[0.15em] text-ink-900">内置视角</h2>
      <p className="mt-2 text-sm text-ink-700">
        每位「视角」是一套说话与提问的习惯，入席后按各自脉络回应主持与他人，不是百科词条。
      </p>
      <ul className="mt-6 space-y-5 text-left">
        {skills.map((s) => (
          <li key={s.skillId} className="rounded-sm border border-ink-200/40 bg-paper-100/20 px-4 py-3">
            <h3 className="font-medium text-cinnabar-800">{s.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{s.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
