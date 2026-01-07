import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});

export type CreateOrganizationDTO = z.infer<typeof CreateOrganizationSchema>;
