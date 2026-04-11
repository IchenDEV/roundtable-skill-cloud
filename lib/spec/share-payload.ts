import { z } from "zod";
import { MAX_SKILL_ID_LENGTH, MAX_SKILL_NAMES_IN_SHARE, MAX_SKILL_NAME_VALUE_CHARS } from "./constants";
import { roundtableStateSchema } from "./schema";

export const skillNamesSchema = z
  .record(z.string().max(MAX_SKILL_ID_LENGTH), z.string().max(MAX_SKILL_NAME_VALUE_CHARS))
  .refine((obj) => Object.keys(obj).length <= MAX_SKILL_NAMES_IN_SHARE, {
    message: `skillNames 最多 ${MAX_SKILL_NAMES_IN_SHARE} 项`,
  });

/** 分享展卷 JSON（存入 roundtable_share_snapshots.payload） */
export const sharePayloadSchema = z.object({
  v: z.literal(1),
  state: roundtableStateSchema,
  skillNames: skillNamesSchema.default({}),
});

export type SharePayload = z.infer<typeof sharePayloadSchema>;
