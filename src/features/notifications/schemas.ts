import { z } from "zod";

// Migration placeholder: expand with boundary DTO parsing when feature contracts are touched.
export const notificationsSchemaVersion = z.literal("v1");
export type NotificationsSchemaVersion = z.infer<
  typeof notificationsSchemaVersion
>;
