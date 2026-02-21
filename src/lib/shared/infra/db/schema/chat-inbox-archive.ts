import { sql } from "drizzle-orm";
import {
  check,
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

export const chatInboxArchive = pgTable(
  "chat_inbox_archive",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    threadKind: text("thread_kind").notNull(),
    threadId: text("thread_id").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "chat_inbox_archive_thread_kind_check",
      sql`${table.threadKind} in ('reservation', 'support')`,
    ),
    uniqueIndex("uq_chat_inbox_archive_user_thread").on(
      table.userId,
      table.threadKind,
      table.threadId,
    ),
    index("idx_chat_inbox_archive_user_kind").on(
      table.userId,
      table.threadKind,
    ),
  ],
);

export const ChatInboxArchiveSchema = createSelectSchema(chatInboxArchive);
export const InsertChatInboxArchiveSchema =
  createInsertSchema(chatInboxArchive);

export type ChatInboxArchiveRecord = z.infer<typeof ChatInboxArchiveSchema>;
export type InsertChatInboxArchive = z.infer<
  typeof InsertChatInboxArchiveSchema
>;
