import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { placeAddon } from "./place-addon";

/**
 * Place Addon Rate Rule table
 * Time-window rate definitions for HOURLY GLOBAL add-ons.
 * Only used when place_addon.pricing_type = 'HOURLY'.
 */
export const placeAddonRateRule = pgTable(
  "place_addon_rate_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => placeAddon.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    hourlyRateCents: integer("hourly_rate_cents"),
    currency: varchar("currency", { length: 3 }),
  },
  (table) => [
    index("idx_place_addon_rate_rule_addon").on(table.addonId),
    check(
      "place_addon_rate_rule_day_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
    check(
      "place_addon_rate_rule_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "place_addon_rate_rule_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "place_addon_rate_rule_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "place_addon_rate_rule_hourly_non_negative",
      sql`${table.hourlyRateCents} IS NULL OR ${table.hourlyRateCents} >= 0`,
    ),
  ],
);

export const PlaceAddonRateRuleSchema = createSelectSchema(placeAddonRateRule);
export const InsertPlaceAddonRateRuleSchema =
  createInsertSchema(placeAddonRateRule);

export type PlaceAddonRateRuleRecord = z.infer<typeof PlaceAddonRateRuleSchema>;
export type InsertPlaceAddonRateRule = z.infer<
  typeof InsertPlaceAddonRateRuleSchema
>;
