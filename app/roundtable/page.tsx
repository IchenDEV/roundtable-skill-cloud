import { RoundtableClient } from "./roundtable-client";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { toSkillSummaries } from "@/lib/skills/presentable-skills";
import { parseRoundtableSearchParams, type RoundtableSearchParams } from "@/lib/roundtable/roundtable-search";

export const dynamic = "force-dynamic";

export default async function RoundtablePage({ searchParams }: { searchParams: Promise<RoundtableSearchParams> }) {
  const q = await searchParams;
  const { initialTopic, resumeSessionId, fromShareToken, initialSkillIds, initialMaxRounds } =
    parseRoundtableSearchParams(q);

  let skills: { skillId: string; name: string; description: string; category: string }[] = [];
  try {
    skills = toSkillSummaries(loadSkillManifest());
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
