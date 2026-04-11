import Link from "next/link";
import { FadeIn } from "@/components/MotionRoot";
import { HomeExamples } from "@/components/home/HomeExamples";
import { HomeSkillIntro } from "@/components/home/HomeSkillIntro";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const btnBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-4 text-sm font-medium whitespace-nowrap outline-none transition-[transform,box-shadow,border-color] duration-150 select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]";

const btnInk = cn(btnBase, "border-transparent bg-ink-900 text-primary-foreground shadow-sm hover:bg-ink-800");

const btnOutline = cn(btnBase, "border-ink-200/70 bg-paper-50/50 text-ink-800 hover:border-gold-500/70");

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
      <section className="py-12 text-center">
        <h1 className="font-serif text-3xl tracking-[0.25em] text-ink-900 md:text-4xl">圆桌</h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-700">
          你写下一个议题，请几位不同「视角」入席；一位主持先定调、再追问，每位视角回应彼此而非自说自话。每一轮说完，主持会收起要点、请你决定是否再续；直到你钤印结案，便得到一份共识、分歧与可行动的收束稿。
        </p>
        {!isLoggedIn && (
          <p className="mx-auto mt-4 max-w-md text-xs text-ink-600">
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
        <div className="mt-8 flex flex-wrap justify-center gap-4 font-sans">
          {!isLoggedIn && (
            <Link href="/login" className={btnOutline}>
              登入
            </Link>
          )}
          <Link href="/roundtable" className={btnInk}>
            入席
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
