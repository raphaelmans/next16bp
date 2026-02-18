import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const organizationSchemaVersion = z.literal("v1");
export type OrganizationSchemaVersion = z.infer<
  typeof organizationSchemaVersion
>;
