import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { sport } from "./sport";

/**
 * Coach Sport table
 * Sports offered by a coach.
 */
export const coachSport = pgTable(
  "coach_sport",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sport.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_sport_coach_sport").on(table.coachId, table.sportId),
    index("idx_coach_sport_sport").on(table.sportId),
  ],
);

export const CoachSportSchema = createSelectSchema(coachSport);
export const InsertCoachSportSchema = createInsertSchema(coachSport);

export type CoachSportRecord = z.infer<typeof CoachSportSchema>;
export type InsertCoachSport = z.infer<typeof InsertCoachSportSchema>;
