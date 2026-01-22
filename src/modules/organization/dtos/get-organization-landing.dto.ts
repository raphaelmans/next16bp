import { z } from "zod";

export const GetOrganizationLandingBySlugSchema = z.object({
  slug: z.string().trim().min(1).max(100),
});

export type GetOrganizationLandingBySlugDTO = z.infer<
  typeof GetOrganizationLandingBySlugSchema
>;
