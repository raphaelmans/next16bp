import { z } from "zod";
import { S } from "@/common/schemas";

const PlaceAddonRuleSchema = z
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

const PlaceAddonSchema = z.object({
  label: S.common.requiredText.max(100, {
    error: "Addon label must be 100 characters or less",
  }),
  isActive: z.boolean().optional(),
  mode: z.enum(["OPTIONAL", "AUTO"]),
  pricingType: z.enum(["HOURLY", "FLAT"]),
  flatFeeCents: S.pricing.priceCents.optional(),
  displayOrder: S.common.displayOrder.optional(),
  rules: z.array(PlaceAddonRuleSchema).max(S.courtRateRule.rulesMax.value, {
    error: S.courtRateRule.rulesMax.message,
  }),
});

export const SetPlaceAddonsSchema = z.object({
  placeId: S.ids.placeId,
  addons: z.array(PlaceAddonSchema).max(50, {
    error: "Addons must be 50 items or less",
  }),
});

export const GetPlaceAddonsSchema = z.object({
  placeId: S.ids.placeId,
});

export type SetPlaceAddonsDTO = z.infer<typeof SetPlaceAddonsSchema>;
export type GetPlaceAddonsDTO = z.infer<typeof GetPlaceAddonsSchema>;
