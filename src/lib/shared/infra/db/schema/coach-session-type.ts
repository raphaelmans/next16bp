import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { coachSessionTypeEnum } from "./enums";

/**
 * Coach Session Type table
 * Session formats offered by a coach.
 */
export const coachSessionType = pgTable(
  "coach_session_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    sessionType: coachSessionTypeEnum("session_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_session_type_coach_session_type").on(
      table.coachId,
      table.sessionType,
    ),
  ],
);

export const CoachSessionTypeSchema = createSelectSchema(coachSessionType);
export const InsertCoachSessionTypeSchema =
  createInsertSchema(coachSessionType);

export type CoachSessionTypeRecord = z.infer<typeof CoachSessionTypeSchema>;
export type InsertCoachSessionType = z.infer<
  typeof InsertCoachSessionTypeSchema
>;
