import { z } from "zod";

/**
 * Schema for creating a reservable court (by organization owner)
 */
export const CreateReservableCourtSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  latitude: z.string().regex(/^-?\d+\.\d+$/, "Invalid latitude format"),
  longitude: z.string().regex(/^-?\d+\.\d+$/, "Invalid longitude format"),
  // Reservable court details
  isFree: z.boolean().default(false),
  defaultPriceCents: z.number().int().min(0).nullable().optional(),
  defaultCurrency: z.string().length(3).default("PHP"),
  // Optional initial photos and amenities
  photos: z.array(z.string().url()).max(10).optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
});

export type CreateReservableCourtDTO = z.infer<
  typeof CreateReservableCourtSchema
>;
