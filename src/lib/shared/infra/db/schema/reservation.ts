import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import type { PricingBreakdown } from "@/common/pricing-breakdown";
import { coach } from "./coach";
import { court } from "./court";
import { reservationStatusEnum, triggeredByRoleEnum } from "./enums";
import { guestProfile } from "./guest-profile";
import { organizationPaymentMethod } from "./organization-payment";
import { place } from "./place";
import { profile } from "./profile";

/**
 * Reservation Group table
 * Groups multiple reservation rows created in a single checkout flow.
 */
export const reservationGroup = pgTable(
  "reservation_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => profile.id, {
      onDelete: "cascade",
    }),
    playerNameSnapshot: varchar("player_name_snapshot", { length: 100 }),
    playerEmailSnapshot: varchar("player_email_snapshot", { length: 255 }),
    playerPhoneSnapshot: varchar("player_phone_snapshot", { length: 20 }),
    totalPriceCents: integer("total_price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reservation_group_place").on(table.placeId),
    index("idx_reservation_group_player").on(table.playerId),
    index("idx_reservation_group_created").on(table.createdAt),
  ],
);

export const ReservationGroupSchema = createSelectSchema(reservationGroup);
export const InsertReservationGroupSchema =
  createInsertSchema(reservationGroup);

export type ReservationGroupRecord = z.infer<typeof ReservationGroupSchema>;
export type InsertReservationGroup = z.infer<
  typeof InsertReservationGroupSchema
>;

/**
 * Reservation table
 * Booking record linking a player to a reservable target time range.
 */
export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id").references(() => court.id, {
      onDelete: "cascade",
    }),
    coachId: uuid("coach_id").references(() => coach.id, {
      onDelete: "set null",
    }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    totalPriceCents: integer("total_price_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
    pricingBreakdown: jsonb(
      "pricing_breakdown",
    ).$type<PricingBreakdown | null>(),
    playerId: uuid("player_id").references(() => profile.id, {
      onDelete: "cascade",
    }),
    groupId: uuid("group_id").references(() => reservationGroup.id, {
      onDelete: "set null",
    }),
    guestProfileId: uuid("guest_profile_id").references(() => guestProfile.id, {
      onDelete: "restrict",
    }),
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
    pingOwnerCount: integer("ping_owner_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reservation_player").on(table.playerId),
    index("idx_reservation_status").on(table.status),
    index("idx_reservation_coach").on(table.coachId),
    index("idx_reservation_court_start").on(table.courtId, table.startTime),
    index("idx_reservation_coach_start").on(table.coachId, table.startTime),
    index("idx_reservation_player_status_created").on(
      table.playerId,
      table.status,
      table.createdAt,
    ),
    index("idx_reservation_time_range").on(table.startTime, table.endTime),
    index("idx_reservation_guest_profile").on(table.guestProfileId),
    index("idx_reservation_group").on(table.groupId),
    index("idx_reservation_expires")
      .on(table.expiresAt)
      .where(
        sql`${table.status} IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER')`,
      ),
    index("idx_reservation_active_court_time")
      .on(table.courtId, table.startTime, table.endTime)
      .where(
        sql`${table.status} IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED')`,
      ),
    index("idx_reservation_active_coach_time")
      .on(table.coachId, table.startTime, table.endTime)
      .where(
        sql`${table.status} IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED')`,
      ),
    check(
      "chk_reservation_identity",
      sql`((${table.playerId} IS NOT NULL)::int + (${table.guestProfileId} IS NOT NULL)::int) = 1`,
    ),
    check(
      "chk_reservation_target",
      sql`((${table.courtId} IS NOT NULL)::int + (${table.coachId} IS NOT NULL)::int) = 1`,
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
  filePath: text("file_path"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  paymentMethodId: uuid("payment_method_id").references(
    () => organizationPaymentMethod.id,
    { onDelete: "set null" },
  ),
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
