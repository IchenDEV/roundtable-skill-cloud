import { FadeIn } from "@/components/motion-root";
import { HomeExamples } from "@/components/home/home-examples";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSkillIntro } from "@/components/home/home-skill-intro";
import { HOME_HIGHLIGHT_CONFIG, HOME_PROCESS_STEPS } from "@/lib/home/home-page-data";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const manifest = loadSkillManifest();
    skills = manifest.skills.map((skill) => ({
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      category: skill.category,
    }));
  } catch {
    skills = [];
  }

  const highlights = HOME_HIGHLIGHT_CONFIG.map((item) => ({
    label: item.label,
    value: item.value(skills.length, new Set(skills.map((skill) => skill.category || "其他")).size),
  }));

  return (
    <FadeIn>
      <HomeHero isLoggedIn={isLoggedIn} highlights={highlights} processSteps={HOME_PROCESS_STEPS} />
      <HomeExamples availableSkillIds={skills.map((skill) => skill.skillId)} />
      <HomeSkillIntro skills={skills} />
    </FadeIn>
  );
}
