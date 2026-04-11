import Link from "next/link";

const EXAMPLES = [
  { label: "科技与人", topic: "人工智能是否会削弱人的主体性？" },
  { label: "工作与选择", topic: "长期待在舒适区，是清醒还是逃避？" },
  { label: "公共讨论", topic: "公共议题的讨论，更需要理性还是共情？" },
];

export function HomeExamples() {
  return (
    <section className="mx-auto mt-16 max-w-2xl border-t border-ink-200/40 pt-10">
      <h2 className="font-serif text-lg tracking-[0.15em] text-ink-900">可试议题</h2>
      <p className="mt-2 text-sm text-ink-700">点选一则，带入圆桌；仍可在席间改写。</p>
      <ul className="mt-6 space-y-3 text-left text-sm">
        {EXAMPLES.map((e) => (
          <li key={e.label}>
            <Link
              href={`/roundtable?topic=${encodeURIComponent(e.topic)}`}
              className="block rounded-md border border-ink-200/50 bg-paper-100/30 px-4 py-3 font-sans text-ink-800 transition-[transform,border-color,color] duration-150 hover:border-gold-500 hover:text-cinnabar-800 active:scale-[0.995]"
            >
              <span className="font-medium text-ink-900">{e.label}</span>
              <span className="mt-1 block text-ink-600">{e.topic}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
