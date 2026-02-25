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
import { placeAddonModeEnum, placeAddonPricingTypeEnum } from "./enums";
import { place } from "./place";

/**
 * Place Addon table
 * GLOBAL add-on definitions scoped to a place (venue).
 * All courts at the venue automatically inherit these add-ons.
 */
export const placeAddon = pgTable(
  "place_addon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    mode: placeAddonModeEnum("mode").notNull(),
    pricingType: placeAddonPricingTypeEnum("pricing_type").notNull(),
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
    index("idx_place_addon_place").on(table.placeId),
    index("idx_place_addon_active").on(table.placeId, table.isActive),
    check(
      "place_addon_flat_fee_non_negative",
      sql`${table.flatFeeCents} IS NULL OR ${table.flatFeeCents} >= 0`,
    ),
  ],
);

export const PlaceAddonSchema = createSelectSchema(placeAddon);
export const InsertPlaceAddonSchema = createInsertSchema(placeAddon);

export type PlaceAddonRecord = z.infer<typeof PlaceAddonSchema>;
export type InsertPlaceAddon = z.infer<typeof InsertPlaceAddonSchema>;
