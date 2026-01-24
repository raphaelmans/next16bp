import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";
import { reservationStatusEnum, triggeredByRoleEnum } from "./enums";
import { profile } from "./profile";

/**
 * Reservation table
 * Booking record linking a player to a court time range
 */
export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    totalPriceCents: integer("total_price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
    playerId: uuid("player_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    playerNameSnapshot: varchar("player_name_snapshot", { length: 100 }),
    playerEmailSnapshot: varchar("player_email_snapshot", { length: 255 }),
    playerPhoneSnapshot: varchar("player_phone_snapshot", { length: 20 }),
    status: reservationStatusEnum("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reservation_player").on(table.playerId),
    index("idx_reservation_status").on(table.status),
    index("idx_reservation_court_start").on(table.courtId, table.startTime),
    index("idx_reservation_player_status_created").on(
      table.playerId,
      table.status,
      table.createdAt,
    ),
    index("idx_reservation_time_range").on(table.startTime, table.endTime),
    index("idx_reservation_expires")
      .on(table.expiresAt)
      .where(
        sql`${table.status} IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER')`,
      ),
  ],
);

export const ReservationSchema = createSelectSchema(reservation);
export const InsertReservationSchema = createInsertSchema(reservation);

export type ReservationRecord = z.infer<typeof ReservationSchema>;
export type InsertReservation = z.infer<typeof InsertReservationSchema>;

/**
 * Payment Proof table
 * Optional payment proof uploaded by player (1:1 with reservation)
 */
export const paymentProof = pgTable("payment_proof", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .unique()
    .references(() => reservation.id, { onDelete: "cascade" }),
  fileUrl: text("file_url"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const PaymentProofSchema = createSelectSchema(paymentProof);
export const InsertPaymentProofSchema = createInsertSchema(paymentProof);

export type PaymentProofRecord = z.infer<typeof PaymentProofSchema>;
export type InsertPaymentProof = z.infer<typeof InsertPaymentProofSchema>;

/**
 * Reservation Event table (Audit Log)
 * Tracks all reservation status transitions
 */
export const reservationEvent = pgTable(
  "reservation_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    fromStatus: varchar("from_status", { length: 30 }),
    toStatus: varchar("to_status", { length: 30 }).notNull(),
    triggeredByUserId: uuid("triggered_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "set null",
      },
    ),
    triggeredByRole: triggeredByRoleEnum("triggered_by_role").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reservation_event_reservation").on(table.reservationId),
  ],
);

export const ReservationEventSchema = createSelectSchema(reservationEvent);
export const InsertReservationEventSchema =
  createInsertSchema(reservationEvent);

export type ReservationEventRecord = z.infer<typeof ReservationEventSchema>;
export type InsertReservationEvent = z.infer<
  typeof InsertReservationEventSchema
>;
