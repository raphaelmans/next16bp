import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { coachVenueStatusEnum } from "./enums";
import { place } from "./place";

/**
 * Coach Venue table
 * Tracks coach invitations and accepted venue attachments.
 */
export const coachVenue = pgTable(
  "coach_venue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    status: coachVenueStatusEnum("status").notNull().default("PENDING"),
    invitedByUserId: uuid("invited_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_venue_active_per_place")
      .on(table.coachId, table.placeId)
      .where(sql`${table.status} IN ('PENDING', 'ACCEPTED')`),
    index("idx_coach_venue_place_status").on(table.placeId, table.status),
    index("idx_coach_venue_coach_status").on(table.coachId, table.status),
  ],
);

export const CoachVenueSchema = createSelectSchema(coachVenue);
export const InsertCoachVenueSchema = createInsertSchema(coachVenue);

export type CoachVenueRecord = z.infer<typeof CoachVenueSchema>;
export type InsertCoachVenue = z.infer<typeof InsertCoachVenueSchema>;
