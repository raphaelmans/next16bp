import { z } from "zod";

export const UpdateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(150).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateOrganizationDTO = z.infer<typeof UpdateOrganizationSchema>;
