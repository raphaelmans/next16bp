import { z } from "zod";

export const UpdateSlotPriceSchema = z
  .object({
    slotId: z.string().uuid(),
    priceCents: z.number().int().min(0).nullable(),
    currency: z.string().length(3).nullable(),
  })
  .refine(
    (data) =>
      (data.priceCents === null && data.currency === null) ||
      (data.priceCents !== null && data.currency !== null),
    {
      message: "Price and currency must both be provided or both be null",
      path: ["priceCents"],
    },
  );

export type UpdateSlotPriceDTO = z.infer<typeof UpdateSlotPriceSchema>;

export const BlockSlotSchema = z.object({
  slotId: z.string().uuid(),
});

export type BlockSlotDTO = z.infer<typeof BlockSlotSchema>;

export const UnblockSlotSchema = z.object({
  slotId: z.string().uuid(),
});

export type UnblockSlotDTO = z.infer<typeof UnblockSlotSchema>;

export const DeleteSlotSchema = z.object({
  slotId: z.string().uuid(),
});

export type DeleteSlotDTO = z.infer<typeof DeleteSlotSchema>;
