import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { reservation } from "./reservation";

/**
 * Reservation Chat Thread
 * Maps a reservation to a provider-specific channel.
 */
export const reservationChatThread = pgTable(
  "reservation_chat_thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .unique()
      .references(() => reservation.id, { onDelete: "cascade" }),
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
    index("idx_reservation_chat_thread_reservation_id").on(table.reservationId),
    index("idx_reservation_chat_thread_provider_channel").on(
      table.providerId,
      table.providerChannelType,
      table.providerChannelId,
    ),
    uniqueIndex("uq_reservation_chat_thread_provider_channel").on(
      table.providerId,
      table.providerChannelType,
      table.providerChannelId,
    ),
  ],
);

export const ReservationChatThreadSchema = createSelectSchema(
  reservationChatThread,
);
export const InsertReservationChatThreadSchema = createInsertSchema(
  reservationChatThread,
);

export type ReservationChatThreadRecord = z.infer<
  typeof ReservationChatThreadSchema
>;
export type InsertReservationChatThread = z.infer<
  typeof InsertReservationChatThreadSchema
>;

/**
 * Reservation Chat Transcript Snapshot
 * Immutable evidence capture of a channel at a point-in-time.
 */
export const reservationChatTranscript = pgTable(
  "reservation_chat_transcript",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id", { length: 20 }).notNull(),
    providerChannelType: varchar("provider_channel_type", {
      length: 32,
    }).notNull(),
    providerChannelId: varchar("provider_channel_id", {
      length: 128,
    }).notNull(),
    capturedByUserId: uuid("captured_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "set null",
      },
    ),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    messageCount: integer("message_count").notNull(),
    firstMessageAt: timestamp("first_message_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    transcriptSha256: varchar("transcript_sha256", { length: 64 }).notNull(),
    transcriptJson: jsonb("transcript_json")
      .$type<Record<string, unknown>>()
      .notNull(),
  },
  (table) => [
    index("idx_reservation_chat_transcript_reservation_id_captured_at").on(
      table.reservationId,
      table.capturedAt,
    ),
  ],
);

export const ReservationChatTranscriptSchema = createSelectSchema(
  reservationChatTranscript,
);
export const InsertReservationChatTranscriptSchema = createInsertSchema(
  reservationChatTranscript,
);

export type ReservationChatTranscriptRecord = z.infer<
  typeof ReservationChatTranscriptSchema
>;
export type InsertReservationChatTranscript = z.infer<
  typeof InsertReservationChatTranscriptSchema
>;
