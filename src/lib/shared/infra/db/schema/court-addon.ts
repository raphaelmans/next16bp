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
import { court } from "./court";
import { courtAddonModeEnum, courtAddonPricingTypeEnum } from "./enums";

/**
 * Court Addon table
 * Add-on definitions scoped to a court.
 */
export const courtAddon = pgTable(
  "court_addon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
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
    index("idx_court_addon_court").on(table.courtId),
    index("idx_court_addon_active").on(table.courtId, table.isActive),
    check(
      "court_addon_flat_fee_non_negative",
      sql`${table.flatFeeCents} IS NULL OR ${table.flatFeeCents} >= 0`,
    ),
  ],
);

export const CourtAddonSchema = createSelectSchema(courtAddon);
export const InsertCourtAddonSchema = createInsertSchema(courtAddon);

export type CourtAddonRecord = z.infer<typeof CourtAddonSchema>;
export type InsertCourtAddon = z.infer<typeof InsertCourtAddonSchema>;
