import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { court } from "./court";
import { timeSlotStatusEnum } from "./enums";

/**
 * Time Slot table
 * Bookable time slots for reservable courts
 */
export const timeSlot = pgTable(
  "time_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: timeSlotStatusEnum("status").notNull().default("AVAILABLE"),
    priceCents: integer("price_cents"),
    currency: varchar("currency", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes
    index("idx_timeslot_court_status").on(table.courtId, table.status),
    index("idx_timeslot_start").on(table.startTime),
    index("idx_timeslot_available")
      .on(table.courtId, table.startTime)
      .where(sql`${table.status} = 'AVAILABLE'`),
    // Unique constraint: no duplicate start times for same court
    unique("time_slot_court_id_start_time_unique").on(
      table.courtId,
      table.startTime,
    ),
    // Check constraints
    check(
      "time_slot_end_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      "time_slot_price_currency_consistency",
      sql`(${table.priceCents} IS NULL AND ${table.currency} IS NULL) OR (${table.priceCents} IS NOT NULL AND ${table.currency} IS NOT NULL)`,
    ),
  ],
);

export const TimeSlotSchema = createSelectSchema(timeSlot);
export const InsertTimeSlotSchema = createInsertSchema(timeSlot);

export type TimeSlotRecord = z.infer<typeof TimeSlotSchema>;
export type InsertTimeSlot = z.infer<typeof InsertTimeSlotSchema>;
