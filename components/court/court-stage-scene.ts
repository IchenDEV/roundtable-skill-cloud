import type { TranscriptEntry } from "@/lib/spec/schema";

type LiveTokens = { role: "moderator" | "speaker"; skillId?: string; text: string } | null;

type StageRole = "moderator" | "speaker" | "user" | "system";

export type CourtStageScene = {
  latest: {
    content: string;
    label: string;
    role: StageRole;
    skillId?: string;
    streaming: boolean;
    placeholder: boolean;
  };
  foregroundSkillId?: string;
  foregroundLabel: string;
  sidePortraitIds: string[];
  roleState: {
    moderator: boolean;
    speaker: boolean;
    user: boolean;
  };
};

function roleLabel(entry: { role: string; skillId?: string }, skillTitle: (id: string) => string) {
  if (entry.role === "moderator") return "审判长";
  if (entry.role === "user") return "席上（你）";
  return entry.skillId ? skillTitle(entry.skillId) : "列席";
}

function latestTranscriptEntry(
  transcript: TranscriptEntry[],
  liveTokens: LiveTokens,
  skillTitle: (id: string) => string
): CourtStageScene["latest"] {
  if (liveTokens) {
    return {
      content: liveTokens.text,
      label: roleLabel(liveTokens, skillTitle),
      streaming: true,
      role: liveTokens.role,
      skillId: liveTokens.skillId,
      placeholder: false,
    };
  }

  const latest = transcript.at(-1);
  if (!latest) {
    return {
      content: "堂上无声。择定议题与列席，鸣槌开庭。",
      label: "候审",
      streaming: false,
      role: "system",
      skillId: undefined,
      placeholder: false,
    };
  }

  if (latest.content.trim()) {
    return {
      content: latest.content,
      label: roleLabel(latest, skillTitle),
      streaming: false,
      role: latest.role as StageRole,
      skillId: latest.skillId,
      placeholder: false,
    };
  }

  return {
    content: "这一回合尚未留下可展示正文。若频繁出现，可回砚台更换执笔后端后重试。",
    label: roleLabel(latest, skillTitle),
    streaming: false,
    role: latest.role as StageRole,
    skillId: latest.skillId,
    placeholder: true,
  };
}

function lastSpeakerSkillId(transcript: TranscriptEntry[]) {
  for (let i = transcript.length - 1; i >= 0; i -= 1) {
    const entry = transcript[i];
    if (entry.role === "speaker" && entry.skillId) return entry.skillId;
  }
  return undefined;
}

// 舞台层只消费这个纯函数产出的场景描述，避免把状态推导和 JSX 绑死在一起。
export function buildCourtStageScene(params: {
  transcript: TranscriptEntry[];
  participantIds: string[];
  liveTokens: LiveTokens;
  activeRole?: "moderator" | "speaker";
  activeSkillId?: string;
  targetSkillId?: string;
  skillTitle: (id: string) => string;
}): CourtStageScene {
  const { transcript, participantIds, liveTokens, activeRole, activeSkillId, targetSkillId, skillTitle } = params;
  const latest = liveTokens?.text.trim()
    ? latestTranscriptEntry(transcript, liveTokens, skillTitle)
    : liveTokens
      ? {
          content: "执笔正在整卷与落字，稍候便会显出正文。",
          label: roleLabel(liveTokens, skillTitle),
          streaming: true,
          role: liveTokens.role,
          skillId: liveTokens.skillId,
          placeholder: true,
        }
      : latestTranscriptEntry(transcript, liveTokens, skillTitle);

  const foregroundSkillId = activeSkillId ?? lastSpeakerSkillId(transcript) ?? participantIds[0];
  const ordered = [
    ...(targetSkillId && targetSkillId !== foregroundSkillId ? [targetSkillId] : []),
    ...participantIds.filter((id) => id !== foregroundSkillId && id !== targetSkillId),
  ];

  return {
    latest,
    foregroundSkillId,
    foregroundLabel: foregroundSkillId ? skillTitle(foregroundSkillId) : "列席",
    sidePortraitIds: [...new Set(ordered)].slice(0, 2),
    roleState: {
      moderator: activeRole === "moderator",
      speaker: !!activeSkillId || liveTokens?.role === "speaker",
      user: latest.role === "user",
    },
  };
}
