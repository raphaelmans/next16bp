import {
  boolean,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";
import { sport } from "./sport";

/**
 * Court table (Unit)
 * Represents a single bookable court inside a place.
 */
export const court = pgTable(
  "court",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id").references(() => place.id, {
      onDelete: "set null",
    }),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sport.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 100 }).notNull(),
    tierLabel: varchar("tier_label", { length: 20 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("court_place_id_label_unique").on(table.placeId, table.label),
    index("idx_court_place").on(table.placeId),
    index("idx_court_sport").on(table.sportId),
    index("idx_court_active").on(table.isActive),
  ],
);

export const CourtSchema = createSelectSchema(court);
export const InsertCourtSchema = createInsertSchema(court);

export type CourtRecord = z.infer<typeof CourtSchema>;
export type InsertCourt = z.infer<typeof InsertCourtSchema>;
