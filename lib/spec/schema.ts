import { z } from "zod";
import {
  BYOK_PROVIDERS,
  MAX_CONTENT_HASH_SNAPSHOT_CHARS,
  MAX_ERROR_STRING_CHARS,
  MAX_MODERATOR_MEMORY_CHARS,
  MAX_PARTICIPANT_SKILL_IDS,
  MAX_ROUND_ROUNDS,
  MAX_SKILL_ID_LENGTH,
  MAX_SYNTHESIS_CHARS,
  MAX_TOPIC_LENGTH,
  MAX_TRANSCRIPT_ENTRIES,
  MAX_TRANSCRIPT_ENTRY_CHARS,
} from "./constants";

export const byokProviderSchema = z.enum(BYOK_PROVIDERS);

export const transcriptEntrySchema = z.object({
  role: z.enum(["moderator", "speaker", "system", "user"]),
  skillId: z.string().max(MAX_SKILL_ID_LENGTH).optional(),
  content: z.string().max(MAX_TRANSCRIPT_ENTRY_CHARS),
  contentHashSnapshot: z.string().max(MAX_CONTENT_HASH_SNAPSHOT_CHARS).optional(),
  ts: z.string().max(64),
});

export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;

export const roundtableModeSchema = z.enum(["discussion", "debate"]);

export const roundtablePhaseSchema = z.enum(["idle", "running", "await_user", "synthesis", "done", "error"]);

export const roundtableStateSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    mode: roundtableModeSchema.default("discussion"),
    topic: z.string().min(1).max(MAX_TOPIC_LENGTH),
    round: z.number().int().nonnegative(),
    maxRounds: z.number().int().positive(),
    phase: roundtablePhaseSchema,
    participantSkillIds: z.array(z.string().max(MAX_SKILL_ID_LENGTH)).max(MAX_PARTICIPANT_SKILL_IDS),
    transcript: z.array(transcriptEntrySchema).max(MAX_TRANSCRIPT_ENTRIES),
    moderatorMemory: z.string().max(MAX_MODERATOR_MEMORY_CHARS),
    userCommand: z.enum(["stop"]).optional(),
    synthesis: z.string().max(MAX_SYNTHESIS_CHARS).optional(),
    error: z.string().max(MAX_ERROR_STRING_CHARS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxRounds > MAX_ROUND_ROUNDS) {
      ctx.addIssue({
        code: "too_big",
        origin: "number",
        message: `maxRounds 不可超过 ${MAX_ROUND_ROUNDS}`,
        path: ["maxRounds"],
        maximum: MAX_ROUND_ROUNDS,
        inclusive: true,
      });
    }
  });

export type RoundtableState = z.infer<typeof roundtableStateSchema>;

export const streamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("token"),
    role: z.enum(["moderator", "speaker"]),
    skillId: z.string().optional(),
    text: z.string(),
  }),
  z.object({
    type: z.literal("turn_complete"),
    role: z.enum(["moderator", "speaker"]),
    skillId: z.string().optional(),
    fullText: z.string(),
  }),
  z.object({ type: z.literal("round_complete"), round: z.number() }),
  z.object({ type: z.literal("synthesis_complete"), text: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;

export const debateActionSchema = z.enum(["attack", "defend", "judge"]);

export type DebateAction = z.infer<typeof debateActionSchema>;

export const turnStepSchema = z.enum([
  "moderator_open",
  "participant",
  "moderator_judge",
  "moderator_wrap",
  "synthesis",
]);

export type TurnStep = z.infer<typeof turnStepSchema>;

export const turnRequestSchema = z.object({
  state: roundtableStateSchema,
  step: turnStepSchema,
  skillId: z.string().max(MAX_SKILL_ID_LENGTH).optional(),
  target: z.string().max(MAX_SKILL_ID_LENGTH).optional(),
  directive: z.string().max(1000).optional(),
  action: debateActionSchema.optional(),
});

export type TurnRequest = z.infer<typeof turnRequestSchema>;

export const turnResponseEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("token"),
    role: z.enum(["moderator", "speaker"]),
    skillId: z.string().optional(),
    text: z.string(),
  }),
  z.object({
    type: z.literal("turn_complete"),
    role: z.enum(["moderator", "speaker"]),
    skillId: z.string().optional(),
    fullText: z.string(),
  }),
  z.object({
    type: z.literal("dispatch"),
    steps: z.array(
      z.object({
        action: debateActionSchema.optional(),
        skillId: z.string(),
        target: z.string().optional(),
        directive: z.string().optional(),
      })
    ),
  }),
  z.object({ type: z.literal("memory"), text: z.string() }),
  z.object({ type: z.literal("synthesis_complete"), text: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);

export type TurnResponseEvent = z.infer<typeof turnResponseEventSchema>;

export const userCredentialInputSchema = z.object({
  provider: byokProviderSchema,
  apiKey: z.string().min(8),
  label: z.string().max(120).optional(),
  apiBaseUrl: z.string().max(512).optional(),
  defaultModel: z.string().max(120).optional(),
});
