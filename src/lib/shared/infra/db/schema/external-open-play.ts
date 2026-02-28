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
import {
  externalOpenPlayReportReasonEnum,
  externalOpenPlaySourcePlatformEnum,
  externalOpenPlayStatusEnum,
  openPlayJoinPolicyEnum,
  openPlayParticipantRoleEnum,
  openPlayParticipantStatusEnum,
  openPlayVisibilityEnum,
} from "./enums";
import { openPlay } from "./open-play";
import { place } from "./place";
import { profile } from "./profile";
import { sport } from "./sport";

/**
 * External Open Play
 * Unverified session created without a reservation anchor.
 */
export const externalOpenPlay = pgTable(
  "external_open_play",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostProfileId: uuid("host_profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "restrict" }),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sport.id, { onDelete: "restrict" }),
    courtLabel: varchar("court_label", { length: 120 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: externalOpenPlayStatusEnum("status").notNull().default("ACTIVE"),
    visibility: openPlayVisibilityEnum("visibility")
      .notNull()
      .default("PUBLIC"),
    joinPolicy: openPlayJoinPolicyEnum("join_policy")
      .notNull()
      .default("REQUEST"),
    maxPlayers: integer("max_players").notNull().default(4),
    title: varchar("title", { length: 80 }),
    note: text("note"),
    sourcePlatform: externalOpenPlaySourcePlatformEnum("source_platform")
      .notNull()
      .default("OTHER"),
    sourceReference: text("source_reference"),
    promotedOpenPlayId: uuid("promoted_open_play_id").references(
      () => openPlay.id,
      { onDelete: "set null" },
    ),
    reportCount: integer("report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_external_open_play_place_starts").on(
      table.placeId,
      table.startsAt,
    ),
    index("idx_external_open_play_status_starts").on(
      table.status,
      table.startsAt,
    ),
    index("idx_external_open_play_host").on(table.hostProfileId),
    uniqueIndex("uq_external_open_play_promoted_open_play")
      .on(table.promotedOpenPlayId)
      .where(sql`${table.promotedOpenPlayId} IS NOT NULL`),
    check(
      "chk_external_open_play_time_order",
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

export const ExternalOpenPlaySchema = createSelectSchema(externalOpenPlay);
export const InsertExternalOpenPlaySchema =
  createInsertSchema(externalOpenPlay);

export type ExternalOpenPlayRecord = z.infer<typeof ExternalOpenPlaySchema>;
export type InsertExternalOpenPlay = z.infer<
  typeof InsertExternalOpenPlaySchema
>;

/**
 * External Open Play Participant
 * Mirrors participation states for unverified sessions.
 */
export const externalOpenPlayParticipant = pgTable(
  "external_open_play_participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalOpenPlayId: uuid("external_open_play_id")
      .notNull()
      .references(() => externalOpenPlay.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    role: openPlayParticipantRoleEnum("role").notNull(),
    status: openPlayParticipantStatusEnum("status").notNull(),
    message: text("message"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedByProfileId: uuid("decided_by_profile_id").references(
      () => profile.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_external_open_play_participant").on(
      table.externalOpenPlayId,
      table.profileId,
    ),
    index("idx_external_open_play_participant_open_play_status").on(
      table.externalOpenPlayId,
      table.status,
    ),
    index("idx_external_open_play_participant_profile").on(table.profileId),
    uniqueIndex("uq_external_open_play_host")
      .on(table.externalOpenPlayId)
      .where(sql`${table.role} = 'HOST'`),
  ],
);

export const ExternalOpenPlayParticipantSchema = createSelectSchema(
  externalOpenPlayParticipant,
);
export const InsertExternalOpenPlayParticipantSchema = createInsertSchema(
  externalOpenPlayParticipant,
);

export type ExternalOpenPlayParticipantRecord = z.infer<
  typeof ExternalOpenPlayParticipantSchema
>;
export type InsertExternalOpenPlayParticipant = z.infer<
  typeof InsertExternalOpenPlayParticipantSchema
>;

/**
 * External Open Play Report
 * Allows community reporting for trust and safety.
 */
export const externalOpenPlayReport = pgTable(
  "external_open_play_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalOpenPlayId: uuid("external_open_play_id")
      .notNull()
      .references(() => externalOpenPlay.id, { onDelete: "cascade" }),
    reporterProfileId: uuid("reporter_profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    reason: externalOpenPlayReportReasonEnum("reason").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_external_open_play_reporter").on(
      table.externalOpenPlayId,
      table.reporterProfileId,
    ),
    index("idx_external_open_play_report_open_play").on(
      table.externalOpenPlayId,
    ),
  ],
);

export const ExternalOpenPlayReportSchema = createSelectSchema(
  externalOpenPlayReport,
);
export const InsertExternalOpenPlayReportSchema = createInsertSchema(
  externalOpenPlayReport,
);

export type ExternalOpenPlayReportRecord = z.infer<
  typeof ExternalOpenPlayReportSchema
>;
export type InsertExternalOpenPlayReport = z.infer<
  typeof InsertExternalOpenPlayReportSchema
>;
