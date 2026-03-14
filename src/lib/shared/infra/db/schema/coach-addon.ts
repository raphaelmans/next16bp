import { sql } from "drizzle-orm";
import {
  boolean,
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
import { courtAddonModeEnum, courtAddonPricingTypeEnum } from "./enums";

/**
 * Coach Addon table
 * Add-on definitions scoped to a coach.
 */
export const coachAddon = pgTable(
  "coach_addon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    mode: courtAddonModeEnum("mode").notNull(),
    pricingType: courtAddonPricingTypeEnum("pricing_type").notNull(),
    flatFeeCents: integer("flat_fee_cents"),
    flatFeeCurrency: varchar("flat_fee_currency", { length: 3 }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_addon_coach").on(table.coachId),
    check(
      "coach_addon_flat_fee_non_negative",
      sql`${table.flatFeeCents} IS NULL OR ${table.flatFeeCents} >= 0`,
    ),
  ],
);

export const CoachAddonSchema = createSelectSchema(coachAddon);
export const InsertCoachAddonSchema = createInsertSchema(coachAddon);

export type CoachAddonRecord = z.infer<typeof CoachAddonSchema>;
export type InsertCoachAddon = z.infer<typeof InsertCoachAddonSchema>;

/**
 * Coach Addon Rate Rule table
 * Time-window applicability for coach addon pricing.
 */
export const coachAddonRateRule = pgTable(
  "coach_addon_rate_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => coachAddon.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    hourlyRateCents: integer("hourly_rate_cents"),
    currency: varchar("currency", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_addon_rate_rule_addon").on(table.addonId),
    check(
      "coach_addon_rate_rule_day_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
    check(
      "coach_addon_rate_rule_start_range",
      sql`${table.startMinute} BETWEEN 0 AND 1439`,
    ),
    check(
      "coach_addon_rate_rule_end_range",
      sql`${table.endMinute} BETWEEN 1 AND 1440`,
    ),
    check(
      "coach_addon_rate_rule_start_before_end",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "coach_addon_rate_rule_hourly_non_negative",
      sql`${table.hourlyRateCents} IS NULL OR ${table.hourlyRateCents} >= 0`,
    ),
  ],
);

export const CoachAddonRateRuleSchema = createSelectSchema(coachAddonRateRule);
export const InsertCoachAddonRateRuleSchema =
  createInsertSchema(coachAddonRateRule);

export type CoachAddonRateRuleRecord = z.infer<typeof CoachAddonRateRuleSchema>;
export type InsertCoachAddonRateRule = z.infer<
  typeof InsertCoachAddonRateRuleSchema
>;
