import { CourtroomClient } from "@/components/court/CourtroomClient";
import { parseRoundtableSearchParams, type RoundtableSearchParams } from "@/lib/roundtable/roundtable-search";
import { loadSkillManifest } from "@/lib/skills/load-manifest";

export const dynamic = "force-dynamic";

export default async function CourtPage({ searchParams }: { searchParams: Promise<RoundtableSearchParams> }) {
  const q = await searchParams;
  const { initialTopic, resumeSessionId, fromShareToken, initialSkillIds, initialMaxRounds } =
    parseRoundtableSearchParams(q);

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

  return (
    <CourtroomClient
      skills={skills}
      initialTopic={initialTopic}
      resumeSessionId={resumeSessionId}
      fromShareToken={fromShareToken}
      initialSkillIds={initialSkillIds}
      initialMaxRounds={initialMaxRounds}
    />
  );
}
