import { z } from "zod";

/**
 * Schema for creating a court with simplified fields (UI onboarding flow)
 * This is a simplified version for quick court creation during organization onboarding.
 * Coordinates default to 0,0 and can be updated later.
 */
export const CreateSimpleCourtSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(150),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  defaultPriceCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).default("PHP"),
});

export type CreateSimpleCourtDTO = z.infer<typeof CreateSimpleCourtSchema>;
