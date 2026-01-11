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
  requiresOwnerConfirmation: z.boolean().default(true),
  paymentHoldMinutes: z.number().int().min(1).max(1440).default(15),
  ownerReviewMinutes: z.number().int().min(1).max(1440).default(15),
  cancellationCutoffMinutes: z.number().int().min(0).max(1440).default(0),
  paymentInstructions: z.string().optional(),
  gcashNumber: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankAccountName: z.string().max(150).optional(),
  // Optional initial photos and amenities
  photos: z.array(z.string().url()).max(10).optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
});

export type CreateReservableCourtDTO = z.infer<
  typeof CreateReservableCourtSchema
>;
