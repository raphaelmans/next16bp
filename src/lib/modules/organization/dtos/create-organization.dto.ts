import { z } from "zod";
import { S } from "@/common/schemas";

export const CreateOrganizationSchema = z.object({
  name: S.organization.name,
  slug: S.organization.slug.optional(),
});

export type CreateOrganizationDTO = z.infer<typeof CreateOrganizationSchema>;
