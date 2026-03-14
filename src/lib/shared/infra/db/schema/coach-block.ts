import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";
import { coachBlockTypeEnum } from "./enums";

/**
 * Coach Block table
 * One-off time blocks that make a coach unavailable.
 */
export const coachBlock = pgTable(
  "coach_block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coach.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    reason: text("reason"),
    blockType: coachBlockTypeEnum("block_type").notNull().default("PERSONAL"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_block_coach_time").on(
      table.coachId,
      table.startTime,
      table.endTime,
    ),
    check(
      "coach_block_end_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
  ],
);

export const CoachBlockSchema = createSelectSchema(coachBlock);
export const InsertCoachBlockSchema = createInsertSchema(coachBlock);

export type CoachBlockRecord = z.infer<typeof CoachBlockSchema>;
export type InsertCoachBlock = z.infer<typeof InsertCoachBlockSchema>;
