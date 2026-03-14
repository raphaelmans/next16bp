import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";

/**
 * Coach Specialty table
 * Focus areas offered by a coach.
 */
export const coachSpecialty = pgTable(
  "coach_specialty",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_specialty_coach_name").on(table.coachId, table.name),
  ],
);

export const CoachSpecialtySchema = createSelectSchema(coachSpecialty);
export const InsertCoachSpecialtySchema = createInsertSchema(coachSpecialty);

export type CoachSpecialtyRecord = z.infer<typeof CoachSpecialtySchema>;
export type InsertCoachSpecialty = z.infer<typeof InsertCoachSpecialtySchema>;
