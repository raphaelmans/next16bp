import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";

/**
 * Coach Photo table
 * Gallery images for a coach profile.
 */
export const coachPhoto = pgTable(
  "coach_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_photo_coach_display_order").on(
      table.coachId,
      table.displayOrder,
    ),
  ],
);

export const CoachPhotoSchema = createSelectSchema(coachPhoto);
export const InsertCoachPhotoSchema = createInsertSchema(coachPhoto);

export type CoachPhotoRecord = z.infer<typeof CoachPhotoSchema>;
export type InsertCoachPhoto = z.infer<typeof InsertCoachPhotoSchema>;
