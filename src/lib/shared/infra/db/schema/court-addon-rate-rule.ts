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
import { courtAddon } from "./court-addon";

/**
 * Court Addon Rate Rule table
 * Time-window applicability for addon pricing.
 */
export const courtAddonRateRule = pgTable(
  "court_addon_rate_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => courtAddon.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    hourlyRateCents: integer("hourly_rate_cents"),
    currency: varchar("currency", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_addon_rate_rule_addon").on(table.addonId),
    check(
      "court_addon_rate_rule_day_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
    check(
      "court_addon_rate_rule_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "court_addon_rate_rule_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "court_addon_rate_rule_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "court_addon_rate_rule_hourly_non_negative",
      sql`${table.hourlyRateCents} IS NULL OR ${table.hourlyRateCents} >= 0`,
    ),
  ],
);

export const CourtAddonRateRuleSchema = createSelectSchema(courtAddonRateRule);
export const InsertCourtAddonRateRuleSchema =
  createInsertSchema(courtAddonRateRule);

export type CourtAddonRateRuleRecord = z.infer<typeof CourtAddonRateRuleSchema>;
export type InsertCourtAddonRateRule = z.infer<
  typeof InsertCourtAddonRateRuleSchema
>;
