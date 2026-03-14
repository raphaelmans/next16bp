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
import { coach } from "./coach";

/**
 * Coach Review table
 * One active review per author with soft deletion for moderation history.
 */
export const coachReview = pgTable(
  "coach_review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
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
    uniqueIndex("uq_coach_review_active_per_user")
      .on(table.coachId, table.authorUserId)
      .where(sql`${table.removedAt} IS NULL`),
    index("idx_coach_review_coach").on(table.coachId),
    index("idx_coach_review_author").on(table.authorUserId),
    index("idx_coach_review_active")
      .on(table.coachId, table.createdAt)
      .where(sql`${table.removedAt} IS NULL`),
    check("coach_review_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const CoachReviewSchema = createSelectSchema(coachReview);
export const InsertCoachReviewSchema = createInsertSchema(coachReview);

export type CoachReviewRecord = z.infer<typeof CoachReviewSchema>;
export type InsertCoachReview = z.infer<typeof InsertCoachReviewSchema>;
