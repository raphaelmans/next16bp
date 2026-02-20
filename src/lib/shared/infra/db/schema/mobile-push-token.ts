import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { mobilePushTokenPlatformEnum } from "./enums";

/**
 * Mobile push token table
 * Stores Expo push tokens per user (multi-device).
 */
export const mobilePushToken = pgTable(
  "mobile_push_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: mobilePushTokenPlatformEnum("platform").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_mobile_push_token_token_unique").on(table.token),
    index("idx_mobile_push_token_user_revoked").on(
      table.userId,
      table.revokedAt,
    ),
  ],
);

export const MobilePushTokenSchema = createSelectSchema(mobilePushToken);
export const InsertMobilePushTokenSchema =
  createInsertSchema(mobilePushToken);

export type MobilePushTokenRecord = z.infer<typeof MobilePushTokenSchema>;
export type InsertMobilePushToken = z.infer<
  typeof InsertMobilePushTokenSchema
>;
