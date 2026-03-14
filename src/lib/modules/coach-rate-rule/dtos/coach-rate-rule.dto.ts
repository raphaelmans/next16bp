import { z } from "zod";
import { S } from "@/common/schemas";

const CoachRateRuleWindowSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
    hourlyRateCents: S.courtRateRule.hourlyRateCents,
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

export const SetCoachRateRulesSchema = z.object({
  coachId: S.ids.coachId,
  rules: z
    .array(CoachRateRuleWindowSchema)
    .max(S.courtRateRule.rulesMax.value, {
      error: S.courtRateRule.rulesMax.message,
    }),
});

export const GetCoachRateRulesSchema = z.object({
  coachId: S.ids.coachId,
});

export type SetCoachRateRulesDTO = z.infer<typeof SetCoachRateRulesSchema>;
export type GetCoachRateRulesDTO = z.infer<typeof GetCoachRateRulesSchema>;
