import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const authSchemaVersion = z.literal("v1");
export type AuthSchemaVersion = z.infer<typeof authSchemaVersion>;
