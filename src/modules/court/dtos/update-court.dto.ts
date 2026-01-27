import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for updating a court (by organization owner)
 */
export const UpdateCourtSchema = z.object({
  courtId: S.ids.courtId,
  name: S.court.name.optional(),
  address: S.place.address.optional(),
  city: S.place.city.optional(),
  latitude: S.common.coordinateString.latitude,
  longitude: S.common.coordinateString.longitude,
  isActive: z.boolean().optional(),
});

export type UpdateCourtDTO = z.infer<typeof UpdateCourtSchema>;

/**
 * Schema for updating reservable court details
 */
export const UpdateReservableCourtDetailSchema = z.object({
  courtId: S.ids.courtId,
  isFree: z.boolean().optional(),
  defaultPriceCents: S.pricing.priceCents.nullish(),
  defaultCurrency: S.common.currency.optional(),
});

export type UpdateReservableCourtDetailDTO = z.infer<
  typeof UpdateReservableCourtDetailSchema
>;
