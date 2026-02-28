import { z } from "zod";
import { S } from "@/common/schemas";

export const ListExternalOpenPlaysByPlaceSchema = z.object({
  placeId: S.ids.placeId,
  fromIso: S.common.isoDateTime.optional(),
  toIso: S.common.isoDateTime.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ListExternalOpenPlaysByPlaceDTO = z.infer<
  typeof ListExternalOpenPlaysByPlaceSchema
>;

export const GetExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
});

export type GetExternalOpenPlayDTO = z.infer<typeof GetExternalOpenPlaySchema>;

export const CreateExternalOpenPlaySchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.generic,
  startsAtIso: S.common.isoDateTime,
  endsAtIso: S.common.isoDateTime,
  courtLabel: z.string().trim().max(120).optional(),
  maxPlayers: z.number().int().min(2).max(32).default(4),
  joinPolicy: z.enum(["REQUEST", "AUTO"]).default("REQUEST"),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).default("PUBLIC"),
  title: z.string().trim().max(80).optional(),
  note: z.string().trim().max(2000).optional(),
  sourcePlatform: z.enum(["RECLUB", "OTHER"]).default("OTHER"),
  sourceReference: z.string().trim().max(1000).optional(),
});

export type CreateExternalOpenPlayDTO = z.infer<
  typeof CreateExternalOpenPlaySchema
>;

export const RequestJoinExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
  message: z.string().trim().max(2000).optional(),
});

export type RequestJoinExternalOpenPlayDTO = z.infer<
  typeof RequestJoinExternalOpenPlaySchema
>;

export const LeaveExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
});

export type LeaveExternalOpenPlayDTO = z.infer<
  typeof LeaveExternalOpenPlaySchema
>;

export const DecideExternalOpenPlayParticipantSchema = z.object({
  externalParticipantId: S.ids.generic,
  decision: z.enum(["CONFIRM", "DECLINE", "WAITLIST"]),
});

export type DecideExternalOpenPlayParticipantDTO = z.infer<
  typeof DecideExternalOpenPlayParticipantSchema
>;

export const ReportExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
  reason: z.enum(["FAKE_SLOT", "IMPERSONATION", "SPAM", "SAFETY", "OTHER"]),
  details: z.string().trim().max(2000).optional(),
});

export type ReportExternalOpenPlayDTO = z.infer<
  typeof ReportExternalOpenPlaySchema
>;

export const PromoteExternalOpenPlaySchema = z
  .object({
    externalOpenPlayId: S.ids.generic,
    reservationId: S.ids.reservationId.optional(),
    reservationGroupId: S.ids.generic.optional(),
  })
  .refine(
    (data) =>
      (data.reservationId ? 1 : 0) + (data.reservationGroupId ? 1 : 0) === 1,
    {
      message: "Provide exactly one of reservationId or reservationGroupId.",
      path: ["reservationId"],
    },
  );

export type PromoteExternalOpenPlayDTO = z.infer<
  typeof PromoteExternalOpenPlaySchema
>;

export const CloseExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
});

export type CloseExternalOpenPlayDTO = z.infer<
  typeof CloseExternalOpenPlaySchema
>;

export const CancelExternalOpenPlaySchema = z.object({
  externalOpenPlayId: S.ids.generic,
});

export type CancelExternalOpenPlayDTO = z.infer<
  typeof CancelExternalOpenPlaySchema
>;
