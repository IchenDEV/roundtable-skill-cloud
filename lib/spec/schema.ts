import { z } from "zod";
import { BYOK_PROVIDERS } from "./constants";

export const byokProviderSchema = z.enum(BYOK_PROVIDERS);

export const transcriptEntrySchema = z.object({
  role: z.enum(["moderator", "speaker", "system", "user"]),
  skillId: z.string().optional(),
  content: z.string(),
  contentHashSnapshot: z.string().optional(),
  ts: z.string(),
});

export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;

export const roundtablePhaseSchema = z.enum(["idle", "running", "await_user", "synthesis", "done", "error"]);

export const roundtableStateSchema = z.object({
  sessionId: z.string().uuid().optional(),
  topic: z.string(),
  round: z.number().int().nonnegative(),
  maxRounds: z.number().int().positive(),
  phase: roundtablePhaseSchema,
  participantSkillIds: z.array(z.string()),
  transcript: z.array(transcriptEntrySchema),
  moderatorMemory: z.string(),
  userCommand: z.enum(["continue", "stop", "deepen", "add_speaker"]).optional(),
  synthesis: z.string().optional(),
  error: z.string().optional(),
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

export const userCredentialInputSchema = z.object({
  provider: byokProviderSchema,
  apiKey: z.string().min(8),
  label: z.string().max(120).optional(),
  apiBaseUrl: z.string().max(512).optional(),
  defaultModel: z.string().max(120).optional(),
});
