import Link from "next/link";
import { FadeIn } from "@/components/motion-root";
import { HomeExamples } from "@/components/home/home-examples";
import { HomeSkillIntro } from "@/components/home/home-skill-intro";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const btnBase =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium whitespace-nowrap outline-none shadow-[0_0_0_1px_theme(colors.ink.200)] hover:shadow-[0_0_0_1px_theme(colors.gold.500)] transition-[transform,box-shadow] duration-150 select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]";

const btnInk = cn(
  btnBase,
  "bg-cinnabar-600 text-card ring-brand hover:bg-cinnabar-700 hover:shadow-[0_0_0_1px_var(--cinnabar)]"
);

const btnOutline = cn(btnBase, "bg-card text-ink-800 ring-border hover:shadow-[0_0_0_1px_var(--cinnabar)]");

export default async function Home() {
  let isLoggedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isLoggedIn = !!user;
    }
  } catch {
    /* proceed as guest */
  }

  let skills: { skillId: string; name: string; description: string; category: string }[] = [];
  try {
    const m = loadSkillManifest();
    skills = m.skills.map((s) => ({
      skillId: s.skillId,
      name: s.name,
      description: s.description,
      category: s.category,
    }));
  } catch {
    skills = [];
  }

  const skillCount = skills.length;
  const categoryCount = new Set(skills.map((skill) => skill.category || "其他")).size;
  const highlights = [
    { label: "可入席人物", value: `${skillCount || 0} 位` },
    { label: "思维门类", value: `${categoryCount || 0} 组` },
    { label: "对谈节奏", value: "多轮续席" },
  ];
  const processSteps = [
    {
      title: "定题",
      description: "写下一问，或先从序页示例起笔。",
    },
    {
      title: "选席",
      description: "按门类挑几位人物，同席交锋，不必一次选满。",
    },
    {
      title: "收束",
      description: "每轮可插话，最后由主持整理共识、分歧与行动。",
    },
  ];

  return (
    <FadeIn>
      <section className="relative overflow-hidden rounded-[2rem] border border-ink-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0.12))] px-6 py-10 shadow-[0_24px_80px_rgba(20,20,19,0.06)] md:px-10 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-full bg-[radial-gradient(circle,rgba(201,100,66,0.12),transparent_70%)] blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:items-start">
          <div>
            <p className="text-xs tracking-[0.35em] text-ink-600">众声列席 一案徐开</p>
            <h1 className="mt-4 font-serif text-4xl tracking-[0.22em] text-ink-900 md:text-5xl">圆桌</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-ink-700 md:text-[1.05rem]">
              你写下一个议题，请几位不同视角入席；主持先定调、再追问，各席彼此回应，而非各说各话。每轮之后，你可插话续问；直到一纸结案，把共识、分歧与可行动的判断慢慢收拢。
            </p>

            <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-ink-200/70 bg-card/80 px-4 py-2 text-ink-700 shadow-[0_8px_30px_rgba(20,20,19,0.04)]"
                >
                  <span className="text-ink-600">{item.label}</span>
                  <span className="ml-2 font-medium text-ink-900">{item.value}</span>
                </div>
              ))}
            </div>

            {!isLoggedIn && (
              <p className="mt-6 max-w-xl text-sm leading-7 text-ink-600">
                建议先
                <Link
                  href="/login"
                  className="text-cinnabar-700 underline decoration-cinnabar-700/60 underline-offset-3"
                >
                  登入
                </Link>
                ，再到
                <Link
                  href="/settings"
                  className="text-cinnabar-700 underline decoration-cinnabar-700/60 underline-offset-3"
                >
                  砚台
                </Link>
                钤印执笔授权，免得谈到半途忽然断墨。
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-4 font-sans">
              {!isLoggedIn && (
                <Link href="/login" className={btnOutline}>
                  登入
                </Link>
              )}
              <Link href="/roundtable" className={btnInk}>
                入席
              </Link>
              <Link href="/court" className={btnOutline}>
                升堂
              </Link>
              <Link href="/settings" className={btnOutline}>
                砚台
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-ink-200/80 bg-card/85 p-6 shadow-[0_12px_40px_rgba(20,20,19,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.3em] text-ink-500">入席小札</p>
                <h2 className="mt-2 font-serif text-2xl tracking-[0.12em] text-ink-900">先看流程，再挑人物</h2>
              </div>
              <div className="rounded-full border border-cinnabar-600/20 bg-cinnabar-600/8 px-3 py-1 text-xs text-cinnabar-700">
                初次使用也不怕空白
              </div>
            </div>
            <ol className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-2xl bg-paper-50/70 px-4 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-card text-sm font-medium text-ink-900">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-ink-200/70 pt-4 text-sm leading-7 text-ink-600">
              初次开席，建议先选
              <span className="px-1 text-ink-900">3 至 5 位</span>
              人物：一位偏结构，一位偏经验，一位偏价值判断，最容易生出真正的张力。
            </p>
          </aside>
        </div>
      </section>

      <HomeExamples />
      <HomeSkillIntro skills={skills} />
    </FadeIn>
  );
}
