import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";

/**
 * Place Photo table
 * Photos associated with a place.
 */
export const placePhoto = pgTable("place_photo", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => place.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const PlacePhotoSchema = createSelectSchema(placePhoto);
export const InsertPlacePhotoSchema = createInsertSchema(placePhoto);

export type PlacePhotoRecord = z.infer<typeof PlacePhotoSchema>;
export type InsertPlacePhoto = z.infer<typeof InsertPlacePhotoSchema>;
