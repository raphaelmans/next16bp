import { z } from "zod";

const CourtRateRuleWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    currency: z.string().length(3),
    hourlyRateCents: z.number().int().min(0),
  })
  .refine((window) => window.startMinute < window.endMinute, {
    message: "Start minute must be before end minute",
    path: ["startMinute"],
  });

export const SetCourtRateRulesSchema = z.object({
  courtId: z.string().uuid(),
  rules: z.array(CourtRateRuleWindowSchema).max(100),
});

export const GetCourtRateRulesSchema = z.object({
  courtId: z.string().uuid(),
});

export type SetCourtRateRulesDTO = z.infer<typeof SetCourtRateRulesSchema>;
export type GetCourtRateRulesDTO = z.infer<typeof GetCourtRateRulesSchema>;
