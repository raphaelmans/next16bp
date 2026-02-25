import {
  index,
  jsonb,
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
 * User notification inbox table.
 * Stores user-facing in-app notification records and read state.
 */
export const userNotification = pgTable(
  "user_notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    readAt: timestamp("read_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_user_notification_idempotency").on(table.idempotencyKey),
    index("idx_user_notification_user_read_created").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    index("idx_user_notification_user_created").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const UserNotificationSchema = createSelectSchema(userNotification);
export const InsertUserNotificationSchema =
  createInsertSchema(userNotification);

export type UserNotificationRecord = z.infer<typeof UserNotificationSchema>;
export type InsertUserNotification = z.infer<
  typeof InsertUserNotificationSchema
>;
