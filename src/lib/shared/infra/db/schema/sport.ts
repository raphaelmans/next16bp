import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Sport table
 * Dimension table for supported sports.
 */
export const sport = pgTable("sport", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const SportSchema = createSelectSchema(sport);
export const InsertSportSchema = createInsertSchema(sport);

export type SportRecord = z.infer<typeof SportSchema>;
export type InsertSport = z.infer<typeof InsertSportSchema>;
