import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const contactSchemaVersion = z.literal("v1");
export type ContactSchemaVersion = z.infer<typeof contactSchemaVersion>;
