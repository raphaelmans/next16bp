import { sql } from "drizzle-orm";
import {
  check,
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
import { claimRequest } from "./claim-request";
import { placeVerificationRequest } from "./place-verification";

/**
 * Support Chat Thread
 * Maps a claim/verification request to a provider-specific channel.
 */
export const supportChatThread = pgTable(
  "support_chat_thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimRequestId: uuid("claim_request_id").references(() => claimRequest.id, {
      onDelete: "cascade",
    }),
    placeVerificationRequestId: uuid(
      "place_verification_request_id",
    ).references(() => placeVerificationRequest.id, { onDelete: "cascade" }),
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
    check(
      "support_chat_thread_one_request",
      sql`(
        (${table.claimRequestId} IS NOT NULL AND ${table.placeVerificationRequestId} IS NULL)
        OR
        (${table.claimRequestId} IS NULL AND ${table.placeVerificationRequestId} IS NOT NULL)
      )`,
    ),
    index("idx_support_chat_thread_claim_request").on(table.claimRequestId),
    index("idx_support_chat_thread_verification_request").on(
      table.placeVerificationRequestId,
    ),
    uniqueIndex("uq_support_chat_thread_provider_channel").on(
      table.providerId,
      table.providerChannelType,
      table.providerChannelId,
    ),
    uniqueIndex("uq_support_chat_thread_claim_request").on(
      table.claimRequestId,
    ),
    uniqueIndex("uq_support_chat_thread_verification_request").on(
      table.placeVerificationRequestId,
    ),
  ],
);

export const SupportChatThreadSchema = createSelectSchema(supportChatThread);
export const InsertSupportChatThreadSchema =
  createInsertSchema(supportChatThread);

export type SupportChatThreadRecord = z.infer<typeof SupportChatThreadSchema>;
export type InsertSupportChatThread = z.infer<
  typeof InsertSupportChatThreadSchema
>;
