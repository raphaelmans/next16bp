import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isLocalUrl = (value?: string) =>
  Boolean(
    value &&
      (value.includes("localhost") ||
        value.includes("127.0.0.1") ||
        value.includes("0.0.0.0")),
  );

const runtimeAppUrl =
  process.env.NODE_ENV === "development" &&
  !isLocalUrl(process.env.NEXT_PUBLIC_APP_URL)
    ? undefined
    : process.env.NEXT_PUBLIC_APP_URL;

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    CHAT_PROVIDER: z.enum(["stream"]).optional(),
    CHAT_POC_ENABLED: z
      .string()
      .transform((value) => value === "true")
      .optional(),
    STREAM_CHAT_API_KEY: z.string().min(1).optional(),
    STREAM_CHAT_API_SECRET: z.string().min(1).optional(),
    GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SECRET_KEY: z.string(),
    RESEND_API_KEY: z.string().min(1),
    SEMAPHORE_API_KEY: z.string().min(1).optional(),
    SEMAPHORE_SENDER_NAME: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
    SEMAPHORE_BASE_URL: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().url().optional(),
    ),
    CONTACT_US_FROM_EMAIL: z.string().min(1),
    CONTACT_US_TO_EMAIL: z.string().min(1),
    NOTIFICATION_EMAIL_ENABLED: z
      .string()
      .transform((v) => v !== "false")
      .optional(),
    NOTIFICATION_SMS_ENABLED: z
      .string()
      .transform((v) => v !== "false")
      .optional(),

    NOTIFICATION_WEB_PUSH_ENABLED: z
      .string()
      .transform((v) => v !== "false")
      .optional(),
    NOTIFICATION_MOBILE_PUSH_ENABLED: z
      .string()
      .transform((v) => v !== "false")
      .optional(),
    EXPO_PUSH_ACCESS_TOKEN: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),

    WEB_PUSH_VAPID_PUBLIC_KEY: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
    WEB_PUSH_VAPID_PRIVATE_KEY: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
    WEB_PUSH_VAPID_SUBJECT: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(1).optional(),
    ),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: runtimeAppUrl,
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY,
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },
});
