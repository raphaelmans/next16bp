import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const UpdateOrganizationSchema = z.object({
  id: S.ids.generic,
  name: S.organization.name.optional(),
  slug: S.organization.slug.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateOrganizationDTO = z.infer<typeof UpdateOrganizationSchema>;
