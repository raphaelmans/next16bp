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
 * Court Rate Rule table
 * Hourly pricing rules by day-of-week and time window.
 */
export const courtRateRule = pgTable(
  "court_rate_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
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
    index("idx_court_rate_rule_court").on(table.courtId),
    check("court_rate_rule_day_range", sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
    check(
      "court_rate_rule_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "court_rate_rule_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "court_rate_rule_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
  ],
);

export const CourtRateRuleSchema = createSelectSchema(courtRateRule);
export const InsertCourtRateRuleSchema = createInsertSchema(courtRateRule);

export type CourtRateRuleRecord = z.infer<typeof CourtRateRuleSchema>;
export type InsertCourtRateRule = z.infer<typeof InsertCourtRateRuleSchema>;
