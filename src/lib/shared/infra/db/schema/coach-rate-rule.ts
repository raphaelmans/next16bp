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
import { coach } from "./coach";

/**
 * Coach Rate Rule table
 * Hourly pricing rules by day-of-week and time window.
 */
export const coachRateRule = pgTable(
  "coach_rate_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    hourlyRateCents: integer("hourly_rate_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_rate_rule_coach_day").on(table.coachId, table.dayOfWeek),
    check("coach_rate_rule_day_range", sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
    check(
      "coach_rate_rule_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "coach_rate_rule_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "coach_rate_rule_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "coach_rate_rule_hourly_non_negative",
      sql`${table.hourlyRateCents} >= 0`,
    ),
  ],
);

export const CoachRateRuleSchema = createSelectSchema(coachRateRule);
export const InsertCoachRateRuleSchema = createInsertSchema(coachRateRule);

export type CoachRateRuleRecord = z.infer<typeof CoachRateRuleSchema>;
export type InsertCoachRateRule = z.infer<typeof InsertCoachRateRuleSchema>;
