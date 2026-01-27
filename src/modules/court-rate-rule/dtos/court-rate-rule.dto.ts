import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

const CourtRateRuleWindowSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
    currency: S.common.currency,
    hourlyRateCents: S.courtRateRule.hourlyRateCents,
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

export const SetCourtRateRulesSchema = z.object({
  courtId: S.ids.courtId,
  rules: z
    .array(CourtRateRuleWindowSchema)
    .max(S.courtRateRule.rulesMax.value, {
      error: S.courtRateRule.rulesMax.message,
    }),
});

export const GetCourtRateRulesSchema = z.object({
  courtId: S.ids.courtId,
});

export const CopyCourtRateRulesSchema = z.object({
  sourceCourtId: S.ids.courtId,
  targetCourtId: S.ids.courtId,
});

export type SetCourtRateRulesDTO = z.infer<typeof SetCourtRateRulesSchema>;
export type GetCourtRateRulesDTO = z.infer<typeof GetCourtRateRulesSchema>;
export type CopyCourtRateRulesDTO = z.infer<typeof CopyCourtRateRulesSchema>;
