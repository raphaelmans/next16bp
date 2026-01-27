import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

const CourtHoursWindowSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

export const SetCourtHoursSchema = z.object({
  courtId: S.ids.courtId,
  windows: z.array(CourtHoursWindowSchema).max(S.courtHours.windowsMax.value, {
    error: S.courtHours.windowsMax.message,
  }),
});

export const GetCourtHoursSchema = z.object({
  courtId: S.ids.courtId,
});

export const CopyCourtHoursSchema = z.object({
  sourceCourtId: S.ids.courtId,
  targetCourtId: S.ids.courtId,
});

export type SetCourtHoursDTO = z.infer<typeof SetCourtHoursSchema>;
export type GetCourtHoursDTO = z.infer<typeof GetCourtHoursSchema>;
export type CopyCourtHoursDTO = z.infer<typeof CopyCourtHoursSchema>;
