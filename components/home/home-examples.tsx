import Link from "next/link";

const EXAMPLES = [
  { label: "科技与人", tone: "适合技术派与哲学派同席", topic: "人工智能是否会削弱人的主体性？" },
  { label: "工作与选择", tone: "适合现实派与价值派对照", topic: "长期待在舒适区，是清醒还是逃避？" },
  { label: "公共讨论", tone: "适合结构分析与传播判断并看", topic: "公共议题的讨论，更需要理性还是共情？" },
];

export function HomeExamples() {
  return (
    <section className="mx-auto mt-20 max-w-5xl border-t border-ink-200/50 pt-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-500">开席题引</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[0.15em] text-ink-900">先借一问起势</h2>
          <p className="mt-3 text-sm leading-7 text-ink-700">
            点选一则即可入席，议题会自动带入圆桌，你仍可在开谈前继续改写。
          </p>
        </div>
        <div className="text-sm text-ink-600">不知道怎么起笔时，先借题试一轮最省心。</div>
      </div>
      <ul className="mt-6 grid gap-4 text-left text-sm md:grid-cols-3">
        {EXAMPLES.map((e) => (
          <li key={e.label}>
            <Link
              href={`/roundtable?topic=${encodeURIComponent(e.topic)}`}
              className="group block h-full rounded-[1.5rem] bg-card/90 px-5 py-5 font-sans text-ink-800 shadow-[0_0_0_1px_var(--border),rgba(0,0,0,0.05)_0px_8px_28px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--cinnabar),rgba(20,20,19,0.08)_0px_16px_40px] hover:text-cinnabar-600 active:scale-[0.995]"
            >
              <span className="inline-flex rounded-full border border-ink-200/70 px-3 py-1 text-xs text-ink-600 transition-colors duration-200 group-hover:border-cinnabar-600/40 group-hover:text-cinnabar-700">
                {e.label}
              </span>
              <span className="mt-4 block text-base leading-7 text-ink-900">{e.topic}</span>
              <span className="mt-3 block text-xs leading-6 text-ink-600">{e.tone}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
