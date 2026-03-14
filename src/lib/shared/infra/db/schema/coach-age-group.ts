import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { coachAgeGroupEnum } from "./enums";

/**
 * Coach Age Group table
 * Age groups served by a coach.
 */
export const coachAgeGroup = pgTable(
  "coach_age_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    ageGroup: coachAgeGroupEnum("age_group").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_age_group_coach_age_group").on(
      table.coachId,
      table.ageGroup,
    ),
  ],
);

export const CoachAgeGroupSchema = createSelectSchema(coachAgeGroup);
export const InsertCoachAgeGroupSchema = createInsertSchema(coachAgeGroup);

export type CoachAgeGroupRecord = z.infer<typeof CoachAgeGroupSchema>;
export type InsertCoachAgeGroup = z.infer<typeof InsertCoachAgeGroupSchema>;
