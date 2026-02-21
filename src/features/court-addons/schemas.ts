import { z } from "zod";

export const AddonModeSchema = z.enum(["OPTIONAL", "AUTO"]);
export const AddonPricingTypeSchema = z.enum(["HOURLY", "FLAT"]);

export const CourtAddonRuleFormSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    hourlyRateCents: z.number().int().min(0).optional(),
    currency: z.string().min(1).max(3).optional(),
  })
  .refine((value) => value.startMinute < value.endMinute, {
    message: "Rule start minute must be before end minute",
    path: ["startMinute"],
  });

export const CourtAddonFormSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(100),
  isActive: z.boolean(),
  mode: AddonModeSchema,
  pricingType: AddonPricingTypeSchema,
  flatFeeCents: z.number().int().min(0).nullable().optional(),
  flatFeeCurrency: z.string().min(1).max(3).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  rules: z.array(CourtAddonRuleFormSchema).max(50),
});

export const SelectedAddonIdsSchema = z.array(z.string().min(1)).max(20);

export type CourtAddonRuleForm = z.infer<typeof CourtAddonRuleFormSchema>;
export type CourtAddonForm = z.infer<typeof CourtAddonFormSchema>;
