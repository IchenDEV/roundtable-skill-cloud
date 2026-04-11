import { z } from "zod";
import { roundtableStateSchema } from "./schema";

/** 分享展卷 JSON（存入 roundtable_share_snapshots.payload） */
export const sharePayloadSchema = z.object({
  v: z.literal(1),
  state: roundtableStateSchema,
  skillNames: z.record(z.string(), z.string()).default({}),
});

export type SharePayload = z.infer<typeof sharePayloadSchema>;
