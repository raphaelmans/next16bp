import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";

/**
 * Coach Session Duration table
 * Session durations offered by a coach.
 */
export const coachSessionDuration = pgTable(
  "coach_session_duration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    durationMinutes: integer("duration_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_session_duration_coach_duration").on(
      table.coachId,
      table.durationMinutes,
    ),
    check(
      "coach_session_duration_allowed_values",
      sql`${table.durationMinutes} IN (30, 60, 90, 120)`,
    ),
  ],
);

export const CoachSessionDurationSchema =
  createSelectSchema(coachSessionDuration);
export const InsertCoachSessionDurationSchema =
  createInsertSchema(coachSessionDuration);

export type CoachSessionDurationRecord = z.infer<
  typeof CoachSessionDurationSchema
>;
export type InsertCoachSessionDuration = z.infer<
  typeof InsertCoachSessionDurationSchema
>;
