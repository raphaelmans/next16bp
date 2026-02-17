import { z } from "zod";
import { S } from "@/common/schemas";

export const DecideOpenPlayParticipantSchema = z.object({
  participantId: S.ids.generic,
  decision: z.enum(["CONFIRM", "DECLINE", "WAITLIST"]),
});

export type DecideOpenPlayParticipantDTO = z.infer<
  typeof DecideOpenPlayParticipantSchema
>;

export const CloseOpenPlaySchema = z.object({
  openPlayId: S.ids.generic,
});

export type CloseOpenPlayDTO = z.infer<typeof CloseOpenPlaySchema>;

export const CancelOpenPlaySchema = z.object({
  openPlayId: S.ids.generic,
});

export type CancelOpenPlayDTO = z.infer<typeof CancelOpenPlaySchema>;
