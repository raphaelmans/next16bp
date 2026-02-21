import { z } from "zod";
import { S } from "@/common/schemas";

const CourtAddonRuleSchema = z
  .object({
    dayOfWeek: S.courtRateRule.dayOfWeek,
    startMinute: S.courtRateRule.startMinute,
    endMinute: S.courtRateRule.endMinute,
    hourlyRateCents: S.courtRateRule.hourlyRateCents.optional(),
    currency: S.common.currency.optional(),
  })
  .refine((window) => window.startMinute < window.endMinute, {
    error: S.courtRateRule.startBeforeEnd,
    path: ["startMinute"],
  });

const CourtAddonSchema = z.object({
  label: S.common.requiredText.max(100, {
    error: "Addon label must be 100 characters or less",
  }),
  isActive: z.boolean().optional(),
  mode: z.enum(["OPTIONAL", "AUTO"]),
  pricingType: z.enum(["HOURLY", "FLAT"]),
  flatFeeCents: S.pricing.priceCents.optional(),
  flatFeeCurrency: S.common.currency.optional(),
  displayOrder: S.common.displayOrder.optional(),
  rules: z.array(CourtAddonRuleSchema).max(S.courtRateRule.rulesMax.value, {
    error: S.courtRateRule.rulesMax.message,
  }),
});

export const SetCourtAddonsSchema = z.object({
  courtId: S.ids.courtId,
  addons: z.array(CourtAddonSchema).max(50, {
    error: "Addons must be 50 items or less",
  }),
});

export const GetCourtAddonsSchema = z.object({
  courtId: S.ids.courtId,
});

export type SetCourtAddonsDTO = z.infer<typeof SetCourtAddonsSchema>;
export type GetCourtAddonsDTO = z.infer<typeof GetCourtAddonsSchema>;
