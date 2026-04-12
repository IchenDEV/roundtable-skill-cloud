import { RoundtableClient } from "./RoundtableClient";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { parseRoundtableSearchParams, type RoundtableSearchParams } from "@/lib/roundtable/roundtable-search";

export const dynamic = "force-dynamic";

export default async function RoundtablePage({ searchParams }: { searchParams: Promise<RoundtableSearchParams> }) {
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
    <RoundtableClient
      skills={skills}
      initialTopic={initialTopic}
      resumeSessionId={resumeSessionId}
      fromShareToken={fromShareToken}
      initialSkillIds={initialSkillIds}
      initialMaxRounds={initialMaxRounds}
    />
  );
}
