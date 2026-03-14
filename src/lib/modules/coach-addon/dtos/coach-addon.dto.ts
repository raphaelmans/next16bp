import { z } from "zod";
import { S } from "@/common/schemas";

const CoachAddonRuleSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
    hourlyRateCents: S.courtRateRule.hourlyRateCents.optional(),
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

const CoachAddonSchema = z.object({
  label: S.common.requiredText.max(100, {
    error: "Addon label must be 100 characters or less",
  }),
  isActive: z.boolean().optional(),
  mode: z.enum(["OPTIONAL", "AUTO"]),
  pricingType: z.enum(["HOURLY", "FLAT"]),
  flatFeeCents: S.pricing.priceCents.optional(),
  displayOrder: S.common.displayOrder.optional(),
  rules: z.array(CoachAddonRuleSchema).max(S.courtRateRule.rulesMax.value, {
    error: S.courtRateRule.rulesMax.message,
  }),
});

export const SetCoachAddonsSchema = z.object({
  coachId: S.ids.coachId,
  addons: z.array(CoachAddonSchema).max(50, {
    error: "Addons must be 50 items or less",
  }),
});

export const GetCoachAddonsSchema = z.object({
  coachId: S.ids.coachId,
});

export type SetCoachAddonsDTO = z.infer<typeof SetCoachAddonsSchema>;
export type GetCoachAddonsDTO = z.infer<typeof GetCoachAddonsSchema>;
