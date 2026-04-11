import { RoundtableClient } from "./RoundtableClient";
import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";
import { loadSkillManifest } from "@/lib/skills/load-manifest";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHARE_TOKEN_RE = /^[a-f0-9]{32}$/i;

export default async function RoundtablePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; resume?: string; fromShare?: string; skills?: string; maxRounds?: string }>;
}) {
  const q = await searchParams;
  const initialTopic = typeof q.topic === "string" && q.topic.trim() ? q.topic.trim() : undefined;
  const resumeRaw = typeof q.resume === "string" ? q.resume.trim() : "";
  const fromShareRaw = typeof q.fromShare === "string" ? q.fromShare.trim() : "";
  const fromShareToken = SHARE_TOKEN_RE.test(fromShareRaw) ? fromShareRaw.toLowerCase() : undefined;
  const resumeSessionId = !fromShareToken && UUID_RE.test(resumeRaw) ? resumeRaw : undefined;

  const skillsParam = typeof q.skills === "string" ? q.skills : "";
  const initialSkillIds = skillsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mr = Number(q.maxRounds);
  const initialMaxRounds = Number.isFinite(mr) && mr >= 1 && mr <= MAX_ROUND_ROUNDS ? Math.floor(mr) : undefined;

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
