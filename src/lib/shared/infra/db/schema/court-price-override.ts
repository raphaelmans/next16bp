import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";

/**
 * Court Price Override table
 * One-off pricing overrides for a time range.
 */
export const courtPriceOverride = pgTable(
  "court_price_override",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    hourlyRateCents: integer("hourly_rate_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_price_override_court_start").on(
      table.courtId,
      table.startTime,
    ),
    check(
      "court_price_override_end_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      "court_price_override_hourly_rate_non_negative",
      sql`${table.hourlyRateCents} >= 0`,
    ),
  ],
);

export const CourtPriceOverrideSchema = createSelectSchema(courtPriceOverride);
export const InsertCourtPriceOverrideSchema =
  createInsertSchema(courtPriceOverride);

export type CourtPriceOverrideRecord = z.infer<typeof CourtPriceOverrideSchema>;
export type InsertCourtPriceOverride = z.infer<
  typeof InsertCourtPriceOverrideSchema
>;
