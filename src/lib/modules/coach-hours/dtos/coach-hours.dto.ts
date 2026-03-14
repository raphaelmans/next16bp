import { z } from "zod";
import { S } from "@/common/schemas";

const CoachHoursWindowSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

export const SetCoachHoursSchema = z.object({
  coachId: S.ids.coachId,
  windows: z.array(CoachHoursWindowSchema).max(S.courtHours.windowsMax.value, {
    error: S.courtHours.windowsMax.message,
  }),
});

export const GetCoachHoursSchema = z.object({
  coachId: S.ids.coachId,
});

export type SetCoachHoursDTO = z.infer<typeof SetCoachHoursSchema>;
export type GetCoachHoursDTO = z.infer<typeof GetCoachHoursSchema>;
