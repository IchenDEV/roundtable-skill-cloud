import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHARE_TOKEN_RE = /^[a-f0-9]{32}$/i;

export type RoundtableSearchParams = {
  topic?: string;
  resume?: string;
  fromShare?: string;
  skills?: string;
  maxRounds?: string;
};

export type ParsedRoundtableSearch = {
  initialTopic?: string;
  resumeSessionId?: string;
  fromShareToken?: string;
  initialSkillIds: string[];
  initialMaxRounds?: number;
};

export function parseRoundtableSearchParams(q: RoundtableSearchParams): ParsedRoundtableSearch {
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

  return { initialTopic, resumeSessionId, fromShareToken, initialSkillIds, initialMaxRounds };
}
