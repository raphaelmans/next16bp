import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";

/**
 * Place Review table
 * Venue reviews tied to place identity. One active review per user per venue.
 * Soft removal via removedAt preserves audit history.
 */
export const placeReview = pgTable(
  "place_review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedByUserId: uuid("removed_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    removalReason: text("removal_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_place_review_active_per_user")
      .on(table.placeId, table.authorUserId)
      .where(sql`${table.removedAt} IS NULL`),
    index("idx_place_review_place").on(table.placeId),
    index("idx_place_review_author").on(table.authorUserId),
    index("idx_place_review_active")
      .on(table.placeId, table.createdAt)
      .where(sql`${table.removedAt} IS NULL`),
    check("place_review_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const PlaceReviewSchema = createSelectSchema(placeReview);
export const InsertPlaceReviewSchema = createInsertSchema(placeReview);

export type PlaceReviewRecord = z.infer<typeof PlaceReviewSchema>;
export type InsertPlaceReview = z.infer<typeof InsertPlaceReviewSchema>;
