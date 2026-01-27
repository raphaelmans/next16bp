import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const AdminSearchOrganizationsSchema = z.object({
  query: S.admin.searchQuery,
  includeInactive: z.boolean().optional(),
  limit: S.organization.search.limit.default(20),
  offset: S.organization.search.offset.default(0),
});

export type AdminSearchOrganizationsDTO = z.infer<
  typeof AdminSearchOrganizationsSchema
>;
