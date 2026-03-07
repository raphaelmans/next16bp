import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { place } from "./place";

/**
 * Court submission status enum
 * Tracks the moderation lifecycle of a user-submitted court
 */
export const courtSubmissionStatusEnum = pgEnum("court_submission_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

/**
 * Court Submission table
 * Tracks user-submitted courts and their moderation status.
 * Links to the place record created for the submission.
 */
export const courtSubmission = pgTable(
  "court_submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    submittedByUserId: uuid("submitted_by_user_id").notNull(),
    status: courtSubmissionStatusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    reviewedByUserId: uuid("reviewed_by_user_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_submission_place_id").on(table.placeId),
    index("idx_court_submission_submitted_by").on(table.submittedByUserId),
    index("idx_court_submission_status").on(table.status),
    index("idx_court_submission_created_at").on(table.createdAt),
  ],
);

export const CourtSubmissionSchema = createSelectSchema(courtSubmission);
export const InsertCourtSubmissionSchema = createInsertSchema(courtSubmission);

export type CourtSubmissionRecord = z.infer<typeof CourtSubmissionSchema>;
export type InsertCourtSubmission = z.infer<typeof InsertCourtSubmissionSchema>;

/**
 * Court Submission Ban table
 * Tracks users banned from submitting courts, with audit trail.
 */
export const courtSubmissionBan = pgTable(
  "court_submission_ban",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    bannedByUserId: uuid("banned_by_user_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_court_submission_ban_user_id").on(table.userId)],
);

export const CourtSubmissionBanSchema = createSelectSchema(courtSubmissionBan);
export const InsertCourtSubmissionBanSchema =
  createInsertSchema(courtSubmissionBan);

export type CourtSubmissionBanRecord = z.infer<typeof CourtSubmissionBanSchema>;
export type InsertCourtSubmissionBan = z.infer<
  typeof InsertCourtSubmissionBanSchema
>;
