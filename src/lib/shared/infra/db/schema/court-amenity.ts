import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { court } from "./court";

/**
 * Court Amenity table
 * Amenities available at a court
 */
export const courtAmenity = pgTable(
  "court_amenity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("court_amenity_court_id_name_unique").on(table.courtId, table.name),
  ],
);

export const CourtAmenitySchema = createSelectSchema(courtAmenity);
export const InsertCourtAmenitySchema = createInsertSchema(courtAmenity);

export type CourtAmenityRecord = z.infer<typeof CourtAmenitySchema>;
export type InsertCourtAmenity = z.infer<typeof InsertCourtAmenitySchema>;
