import { z } from "zod";

export const AdminSearchOrganizationsSchema = z.object({
  query: z.string().trim().max(150).optional(),
  includeInactive: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export type AdminSearchOrganizationsDTO = z.infer<
  typeof AdminSearchOrganizationsSchema
>;
