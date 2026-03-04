import { index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";
import { profile } from "./profile";

export const placeBookmark = pgTable(
  "place_bookmark",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("place_bookmark_profile_id_place_id_unique").on(
      table.profileId,
      table.placeId,
    ),
    index("idx_place_bookmark_profile").on(table.profileId),
    index("idx_place_bookmark_place").on(table.placeId),
  ],
);

export const PlaceBookmarkSchema = createSelectSchema(placeBookmark);
export const InsertPlaceBookmarkSchema = createInsertSchema(placeBookmark);

export type PlaceBookmarkRecord = z.infer<typeof PlaceBookmarkSchema>;
export type InsertPlaceBookmark = z.infer<typeof InsertPlaceBookmarkSchema>;
