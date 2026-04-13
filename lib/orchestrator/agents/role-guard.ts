function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasBracketSpeakerLabel(text: string): boolean {
  return /(^|\n)\s*(?:[-*]\s*)?【[^】\n]{1,40}】/.test(text);
}

function hasColonSpeakerLabel(text: string, names: string[]): boolean {
  if (names.length === 0) return false;
  const pattern = names
    .map((name) => escapeRegExp(name.trim()))
    .filter(Boolean)
    .join("|");
  if (!pattern) return false;
  const re = new RegExp(`(^|\\n)\\s*(?:[-*]\\s*)?(?:${pattern})\\s*[：:]`, "m");
  return re.test(text);
}

export function hasModeratorBoundaryViolation(text: string, participantNames: string[] = []): boolean {
  if (!text.trim()) return false;
  return hasBracketSpeakerLabel(text) || hasColonSpeakerLabel(text, participantNames);
}

export function hasParticipantBoundaryViolation(
  text: string,
  displayName: string,
  participantNames: string[] = []
): boolean {
  if (!text.trim()) return false;
  const otherNames = participantNames.filter((name) => name && name !== displayName);
  return hasBracketSpeakerLabel(text) || hasColonSpeakerLabel(text, ["主持", "主持人", ...otherNames]);
}
