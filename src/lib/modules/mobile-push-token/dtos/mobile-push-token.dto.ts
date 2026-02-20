import { z } from "zod";

export const UpsertMobilePushTokenSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export type UpsertMobilePushTokenDTO = z.infer<
  typeof UpsertMobilePushTokenSchema
>;

export const RevokeMobilePushTokenSchema = z.object({
  expoPushToken: z.string().min(1),
});

export type RevokeMobilePushTokenDTO = z.infer<
  typeof RevokeMobilePushTokenSchema
>;
