import { z } from "zod";

const CourtHoursWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((window) => window.startMinute < window.endMinute, {
    message: "Start minute must be before end minute",
    path: ["startMinute"],
  });

export const SetCourtHoursSchema = z.object({
  courtId: z.string().uuid(),
  windows: z.array(CourtHoursWindowSchema).max(50),
});

export const GetCourtHoursSchema = z.object({
  courtId: z.string().uuid(),
});

export type SetCourtHoursDTO = z.infer<typeof SetCourtHoursSchema>;
export type GetCourtHoursDTO = z.infer<typeof GetCourtHoursSchema>;
