import { z } from "zod";

export const UpdateOrganizationProfileSchema = z.object({
  organizationId: z.string().uuid(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
});

export type UpdateOrganizationProfileDTO = z.infer<
  typeof UpdateOrganizationProfileSchema
>;
