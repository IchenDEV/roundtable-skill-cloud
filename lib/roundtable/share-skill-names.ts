import type { RoundtableState } from "@/lib/spec/schema";

export function pickShareSkillNames(
  state: Pick<RoundtableState, "participantSkillIds" | "transcript">,
  skillNames: Record<string, string>
): Record<string, string> {
  const usedIds = new Set<string>();

  for (const skillId of state.participantSkillIds) {
    if (skillId) usedIds.add(skillId);
  }

  for (const entry of state.transcript) {
    if (entry.skillId) usedIds.add(entry.skillId);
  }

  return Object.fromEntries(
    Array.from(usedIds)
      .map((skillId) => [skillId, skillNames[skillId]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)
  );
}
