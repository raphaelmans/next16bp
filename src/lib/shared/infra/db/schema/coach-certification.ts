import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coach } from "./coach";

/**
 * Coach Certification table
 * Credentials declared by a coach.
 */
export const coachCertification = pgTable("coach_certification", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coach.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  issuingBody: varchar("issuing_body", { length: 200 }),
  level: varchar("level", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const CoachCertificationSchema = createSelectSchema(coachCertification);
export const InsertCoachCertificationSchema =
  createInsertSchema(coachCertification);

export type CoachCertificationRecord = z.infer<typeof CoachCertificationSchema>;
export type InsertCoachCertification = z.infer<
  typeof InsertCoachCertificationSchema
>;
