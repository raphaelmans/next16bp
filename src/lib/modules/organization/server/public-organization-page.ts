import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const getOrganizationBySlugForMetadata = async (slug: string) => {
  const caller = await createServerCaller(`/org/${slug}`);
  return caller.organization.getBySlug({ slug });
};

export const getOrganizationLandingBySlug = async (slug: string) => {
  const caller = await createServerCaller(`/org/${slug}`);
  return caller.organization.getLandingBySlug({ slug });
};
