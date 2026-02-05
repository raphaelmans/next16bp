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

/**
 * Push subscription table
 * Stores browser Web Push subscriptions per user (multi-device).
 */
export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    expirationTime: text("expiration_time"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_push_subscription_endpoint_unique").on(table.endpoint),
    index("idx_push_subscription_user_revoked").on(
      table.userId,
      table.revokedAt,
    ),
  ],
);

export const PushSubscriptionSchema = createSelectSchema(pushSubscription);
export const InsertPushSubscriptionSchema =
  createInsertSchema(pushSubscription);

export type PushSubscriptionRecord = z.infer<typeof PushSubscriptionSchema>;
export type InsertPushSubscription = z.infer<
  typeof InsertPushSubscriptionSchema
>;
