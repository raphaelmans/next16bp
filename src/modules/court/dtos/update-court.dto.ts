import { z } from "zod";

/**
 * Schema for updating a court (by organization owner)
 */
export const UpdateCourtSchema = z.object({
  courtId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  latitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid latitude format")
    .optional(),
  longitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid longitude format")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCourtDTO = z.infer<typeof UpdateCourtSchema>;

/**
 * Schema for updating reservable court details
 */
export const UpdateReservableCourtDetailSchema = z.object({
  courtId: z.string().uuid(),
  isFree: z.boolean().optional(),
  defaultCurrency: z.string().length(3).optional(),
  paymentInstructions: z.string().nullable().optional(),
  gcashNumber: z.string().max(20).nullable().optional(),
  bankName: z.string().max(100).nullable().optional(),
  bankAccountNumber: z.string().max(50).nullable().optional(),
  bankAccountName: z.string().max(150).nullable().optional(),
});

export type UpdateReservableCourtDetailDTO = z.infer<
  typeof UpdateReservableCourtDetailSchema
>;
