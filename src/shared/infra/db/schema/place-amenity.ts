import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";

/**
 * Place Amenity table
 * Amenities available at a place.
 */
export const placeAmenity = pgTable(
  "place_amenity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("place_amenity_place_id_name_unique").on(table.placeId, table.name),
  ],
);

export const PlaceAmenitySchema = createSelectSchema(placeAmenity);
export const InsertPlaceAmenitySchema = createInsertSchema(placeAmenity);

export type PlaceAmenityRecord = z.infer<typeof PlaceAmenitySchema>;
export type InsertPlaceAmenity = z.infer<typeof InsertPlaceAmenitySchema>;
