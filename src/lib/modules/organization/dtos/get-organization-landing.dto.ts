import { z } from "zod";
import { S } from "@/common/schemas";

export const GetOrganizationLandingBySlugSchema = z.object({
  slug: S.organization.slug,
});

export type GetOrganizationLandingBySlugDTO = z.infer<
  typeof GetOrganizationLandingBySlugSchema
>;
