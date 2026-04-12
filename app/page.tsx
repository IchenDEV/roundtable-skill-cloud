import Link from "next/link";
import { FadeIn } from "@/components/MotionRoot";
import { HomeExamples } from "@/components/home/HomeExamples";
import { HomeSkillIntro } from "@/components/home/HomeSkillIntro";
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

  let skills: { skillId: string; name: string; description: string }[] = [];
  try {
    const m = loadSkillManifest();
    skills = m.skills.map((s) => ({
      skillId: s.skillId,
      name: s.name,
      description: s.description,
    }));
  } catch {
    skills = [];
  }

  return (
    <FadeIn>
      <section className="py-16 text-center md:py-20">
        <h1 className="font-serif text-4xl tracking-[0.25em] text-ink-900 md:text-5xl">圆桌</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-[1.6] text-ink-700">
          你写下一个议题，请几位不同「视角」入席；一位主持先定调、再追问，每位视角回应彼此而非自说自话。每一轮说完，主持会收起要点、请你决定是否再续；直到你钤印结案，便得到一份共识、分歧与可行动的收束稿。
        </p>
        {!isLoggedIn && (
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-600">
            建议先
            <Link href="/login" className="text-cinnabar-700 underline">
              登入
            </Link>
            ，再到
            <Link href="/settings" className="text-cinnabar-700 underline">
              砚台
            </Link>
            钤印执笔授权，最后入席开谈——免得半途停下。
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-5 font-sans">
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
      </section>

      <HomeExamples />
      <HomeSkillIntro skills={skills} />
    </FadeIn>
  );
}
