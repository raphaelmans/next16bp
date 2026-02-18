import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const homeSchemaVersion = z.literal("v1");
export type HomeSchemaVersion = z.infer<typeof homeSchemaVersion>;
