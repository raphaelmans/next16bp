import { z } from "zod";

export const CreateTimeSlotSchema = z
  .object({
    courtId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    priceCents: z.number().int().min(0).nullable().optional(),
    currency: z.string().length(3).nullable().optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (data) =>
      (data.priceCents === null && data.currency === null) ||
      (data.priceCents === undefined && data.currency === undefined) ||
      (data.priceCents !== null &&
        data.priceCents !== undefined &&
        data.currency !== null &&
        data.currency !== undefined),
    {
      message: "Price and currency must both be provided or both be null",
      path: ["priceCents"],
    },
  );

export type CreateTimeSlotDTO = z.infer<typeof CreateTimeSlotSchema>;

export const CreateBulkTimeSlotsSchema = z.object({
  courtId: z.string().uuid(),
  slots: z
    .array(
      z
        .object({
          startTime: z.string().datetime(),
          endTime: z.string().datetime(),
          priceCents: z.number().int().min(0).nullable().optional(),
          currency: z.string().length(3).nullable().optional(),
        })
        .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
          message: "End time must be after start time",
          path: ["endTime"],
        }),
    )
    .min(1)
    .max(100),
});

export type CreateBulkTimeSlotsDTO = z.infer<typeof CreateBulkTimeSlotsSchema>;
