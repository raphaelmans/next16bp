import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { coachSkillLevelEnum } from "./enums";

/**
 * Coach Skill Level table
 * Skill levels served by a coach.
 */
export const coachSkillLevel = pgTable(
  "coach_skill_level",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    level: coachSkillLevelEnum("level").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_coach_skill_level_coach_level").on(
      table.coachId,
      table.level,
    ),
  ],
);

export const CoachSkillLevelSchema = createSelectSchema(coachSkillLevel);
export const InsertCoachSkillLevelSchema = createInsertSchema(coachSkillLevel);

export type CoachSkillLevelRecord = z.infer<typeof CoachSkillLevelSchema>;
export type InsertCoachSkillLevel = z.infer<typeof InsertCoachSkillLevelSchema>;
