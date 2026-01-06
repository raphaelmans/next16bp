import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { court } from "./court";

/**
 * Court Photo table
 * Photos associated with a court
 */
export const courtPhoto = pgTable("court_photo", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => court.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const CourtPhotoSchema = createSelectSchema(courtPhoto);
export const InsertCourtPhotoSchema = createInsertSchema(courtPhoto);

export type CourtPhotoRecord = z.infer<typeof CourtPhotoSchema>;
export type InsertCourtPhoto = z.infer<typeof InsertCourtPhotoSchema>;
