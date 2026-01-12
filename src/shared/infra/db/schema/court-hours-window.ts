import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";

/**
 * Court Hours Window table
 * Day-specific operating hours for a court.
 */
export const courtHoursWindow = pgTable(
  "court_hours_window",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_hours_window_court").on(table.courtId),
    check(
      "court_hours_window_day_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
    check(
      "court_hours_window_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "court_hours_window_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "court_hours_window_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
  ],
);

export const CourtHoursWindowSchema = createSelectSchema(courtHoursWindow);
export const InsertCourtHoursWindowSchema =
  createInsertSchema(courtHoursWindow);

export type CourtHoursWindowRecord = z.infer<typeof CourtHoursWindowSchema>;
export type InsertCourtHoursWindow = z.infer<
  typeof InsertCourtHoursWindowSchema
>;
