import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";
import {
  openPlayJoinPolicyEnum,
  openPlayParticipantRoleEnum,
  openPlayParticipantStatusEnum,
  openPlayStatusEnum,
  openPlayVisibilityEnum,
} from "./enums";
import { place } from "./place";
import { profile } from "./profile";
import { reservation, reservationGroup } from "./reservation";
import { sport } from "./sport";

/**
 * Open Play
 * A player-hosted session attached to a single reservation OR a reservation group.
 * Exactly one of `reservationId` / `reservationGroupId` must be set.
 */
export const openPlay = pgTable(
  "open_play",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .unique()
      .references(() => reservation.id, { onDelete: "cascade" }),
    reservationGroupId: uuid("reservation_group_id").references(
      () => reservationGroup.id,
      { onDelete: "cascade" },
    ),
    hostProfileId: uuid("host_profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "restrict" }),
    courtId: uuid("court_id").references(() => court.id, {
      onDelete: "restrict",
    }),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sport.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: openPlayStatusEnum("status").notNull().default("ACTIVE"),
    visibility: openPlayVisibilityEnum("visibility")
      .notNull()
      .default("PUBLIC"),
    joinPolicy: openPlayJoinPolicyEnum("join_policy")
      .notNull()
      .default("REQUEST"),
    maxPlayers: integer("max_players").notNull().default(4),
    title: varchar("title", { length: 80 }),
    note: text("note"),
    paymentInstructions: text("payment_instructions"),
    paymentLinkUrl: varchar("payment_link_url", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_open_play_place_starts").on(table.placeId, table.startsAt),
    index("idx_open_play_status_starts").on(table.status, table.startsAt),
    index("idx_open_play_reservation").on(table.reservationId),
    index("idx_open_play_host").on(table.hostProfileId),
    index("idx_open_play_reservation_group").on(table.reservationGroupId),
    uniqueIndex("uq_open_play_reservation_group")
      .on(table.reservationGroupId)
      .where(sql`${table.reservationGroupId} IS NOT NULL`),
    check(
      "chk_open_play_reservation_xor_group",
      sql`((${table.reservationId} IS NOT NULL)::int + (${table.reservationGroupId} IS NOT NULL)::int) = 1`,
    ),
  ],
);

export const OpenPlaySchema = createSelectSchema(openPlay);
export const InsertOpenPlaySchema = createInsertSchema(openPlay);

export type OpenPlayRecord = z.infer<typeof OpenPlaySchema>;
export type InsertOpenPlay = z.infer<typeof InsertOpenPlaySchema>;

/**
 * Open Play Participant
 * Tracks join requests and confirmed players.
 */
export const openPlayParticipant = pgTable(
  "open_play_participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    openPlayId: uuid("open_play_id")
      .notNull()
      .references(() => openPlay.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    role: openPlayParticipantRoleEnum("role").notNull(),
    status: openPlayParticipantStatusEnum("status").notNull(),
    message: text("message"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedByProfileId: uuid("decided_by_profile_id").references(
      () => profile.id,
      {
        onDelete: "set null",
      },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_open_play_participant_open_play_profile").on(
      table.openPlayId,
      table.profileId,
    ),
    index("idx_open_play_participant_open_play_status").on(
      table.openPlayId,
      table.status,
    ),
    index("idx_open_play_participant_profile").on(table.profileId),
    index("idx_open_play_participant_open_play").on(table.openPlayId),
    // Convenience lookup: one host per open play.
    uniqueIndex("uq_open_play_participant_host")
      .on(table.openPlayId)
      .where(sql`${table.role} = 'HOST'`),
  ],
);

export const OpenPlayParticipantSchema =
  createSelectSchema(openPlayParticipant);
export const InsertOpenPlayParticipantSchema =
  createInsertSchema(openPlayParticipant);

export type OpenPlayParticipantRecord = z.infer<
  typeof OpenPlayParticipantSchema
>;
export type InsertOpenPlayParticipant = z.infer<
  typeof InsertOpenPlayParticipantSchema
>;
