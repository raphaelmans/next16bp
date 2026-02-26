import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Chat Message Attachment shape stored in the attachments JSONB column.
 */
export type ChatMessageAttachment = {
  type?: string;
  url: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
};

/**
 * Chat Message
 * Stores individual messages for any chat thread.
 * Thread IDs correspond to reservation/group channel IDs (e.g. "res-{uuid}", "grp-{uuid}").
 */
export const chatMessage = pgTable(
  "chat_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: varchar("thread_id", { length: 128 }).notNull(),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "set null" }),
    content: text("content"),
    attachments: jsonb("attachments")
      .$type<ChatMessageAttachment[]>()
      .default([])
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_chat_message_thread_created").on(
      table.threadId,
      table.createdAt,
    ),
    index("idx_chat_message_sender").on(table.senderUserId),
  ],
);

export const ChatMessageSchema = createSelectSchema(chatMessage);
export const InsertChatMessageSchema = createInsertSchema(chatMessage);

export type ChatMessageRecord = z.infer<typeof ChatMessageSchema>;
export type InsertChatMessage = z.infer<typeof InsertChatMessageSchema>;

/**
 * Chat Thread Read Position
 * Tracks per-user read position in each thread for unread count calculation.
 */
export const chatThreadReadPosition = pgTable(
  "chat_thread_read_position",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: varchar("thread_id", { length: 128 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_chat_thread_read_position_thread_user").on(
      table.threadId,
      table.userId,
    ),
  ],
);

export const ChatThreadReadPositionSchema = createSelectSchema(
  chatThreadReadPosition,
);
export const InsertChatThreadReadPositionSchema = createInsertSchema(
  chatThreadReadPosition,
);

export type ChatThreadReadPositionRecord = z.infer<
  typeof ChatThreadReadPositionSchema
>;
export type InsertChatThreadReadPosition = z.infer<
  typeof InsertChatThreadReadPositionSchema
>;
