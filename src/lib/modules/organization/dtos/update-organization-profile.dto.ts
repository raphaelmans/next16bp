import { z } from "zod";
import { S } from "@/common/schemas";

export const UpdateOrganizationProfileSchema = z.object({
  organizationId: S.ids.organizationId,
  description: S.organization.description.optional(),
  logoUrl: S.common.url().optional().nullable(),
  contactEmail: S.organization.contactEmail.optional().nullable(),
  contactPhone: S.organization.contactPhone.nullish(),
  address: S.organization.address.nullish(),
});

export type UpdateOrganizationProfileDTO = z.infer<
  typeof UpdateOrganizationProfileSchema
>;
