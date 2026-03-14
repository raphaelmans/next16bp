import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";

/**
 * Coach Hours Window table
 * Weekly availability windows for a coach.
 */
export const coachHoursWindow = pgTable(
  "coach_hours_window",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_hours_window_coach_day").on(
      table.coachId,
      table.dayOfWeek,
    ),
    check(
      "coach_hours_window_day_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
    check(
      "coach_hours_window_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "coach_hours_window_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "coach_hours_window_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
  ],
);

export const CoachHoursWindowSchema = createSelectSchema(coachHoursWindow);
export const InsertCoachHoursWindowSchema =
  createInsertSchema(coachHoursWindow);

export type CoachHoursWindowRecord = z.infer<typeof CoachHoursWindowSchema>;
export type InsertCoachHoursWindow = z.infer<
  typeof InsertCoachHoursWindowSchema
>;
