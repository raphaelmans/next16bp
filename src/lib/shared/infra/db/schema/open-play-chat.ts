import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { openPlay } from "./open-play";

/**
 * Open Play Chat Thread
 * Maps an open play to a provider-specific channel.
 */
export const openPlayChatThread = pgTable(
  "open_play_chat_thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    openPlayId: uuid("open_play_id")
      .notNull()
      .unique()
      .references(() => openPlay.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id", { length: 20 }).notNull(),
    providerChannelType: varchar("provider_channel_type", {
      length: 32,
    }).notNull(),
    providerChannelId: varchar("provider_channel_id", {
      length: 128,
    }).notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_open_play_chat_thread_open_play_id").on(table.openPlayId),
    index("idx_open_play_chat_thread_provider_channel").on(
      table.providerId,
      table.providerChannelType,
      table.providerChannelId,
    ),
    uniqueIndex("uq_open_play_chat_thread_provider_channel").on(
      table.providerId,
      table.providerChannelType,
      table.providerChannelId,
    ),
  ],
);

export const OpenPlayChatThreadSchema = createSelectSchema(openPlayChatThread);
export const InsertOpenPlayChatThreadSchema =
  createInsertSchema(openPlayChatThread);

export type OpenPlayChatThreadRecord = z.infer<typeof OpenPlayChatThreadSchema>;
export type InsertOpenPlayChatThread = z.infer<
  typeof InsertOpenPlayChatThreadSchema
>;
