import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const supportChatSchemaVersion = z.literal("v1");
export type SupportChatSchemaVersion = z.infer<typeof supportChatSchemaVersion>;
