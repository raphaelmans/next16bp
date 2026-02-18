import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const healthSchemaVersion = z.literal("v1");
export type HealthSchemaVersion = z.infer<typeof healthSchemaVersion>;
