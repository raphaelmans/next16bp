import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const CreateOrganizationSchema = z.object({
  name: S.organization.name,
  slug: S.organization.slug.optional(),
});

export type CreateOrganizationDTO = z.infer<typeof CreateOrganizationSchema>;
