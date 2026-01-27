import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for creating a reservable court (by organization owner)
 */
export const CreateReservableCourtSchema = z.object({
  organizationId: S.ids.organizationId,
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  latitude: S.common.coordinateRequired.latitude,
  longitude: S.common.coordinateRequired.longitude,
  // Reservable court details
  isFree: z.boolean().default(false),
  defaultPriceCents: S.pricing.priceCents.nullish(),
  defaultCurrency: S.common.currency.default("PHP"),
  // Optional initial photos and amenities
  photos: z
    .array(S.common.url())
    .max(S.place.photos.max.value, {
      error: S.place.photos.max.message,
    })
    .optional(),
  amenities: z.array(S.place.amenity).optional(),
});

export type CreateReservableCourtDTO = z.infer<
  typeof CreateReservableCourtSchema
>;
