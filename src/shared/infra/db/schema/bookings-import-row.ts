import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { bookingsImportJob } from "./bookings-import-job";
import { bookingsImportSource } from "./bookings-import-source";
import { court } from "./court";
import { courtBlock } from "./court-block";
import { bookingsImportRowStatusEnum } from "./enums";
import { guestProfile } from "./guest-profile";
import { reservation } from "./reservation";

/**
 * Bookings Import Row table
 * Individual rows parsed from an import file with normalized data and validation state.
 */
export const bookingsImportRow = pgTable(
  "bookings_import_row",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => bookingsImportJob.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => bookingsImportSource.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    sourceLineNumber: integer("source_line_number").notNull(),
    status: bookingsImportRowStatusEnum("status").notNull().default("PENDING"),
    // Source data from the file (raw)
    sourceData: jsonb("source_data").$type<Record<string, unknown>>(),
    // Normalized fields
    courtId: uuid("court_id").references(() => court.id, {
      onDelete: "set null",
    }),
    courtLabel: varchar("court_label", { length: 100 }),
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),
    reason: text("reason"),
    // Validation errors (array of error codes/messages)
    errors: jsonb("errors").$type<string[]>(),
    warnings: jsonb("warnings").$type<string[]>(),
    // Commit tracking
    courtBlockId: uuid("court_block_id").references(() => courtBlock.id, {
      onDelete: "set null",
    }),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    skipReason: text("skip_reason"),
    // Guest replacement tracking
    replacedWithReservationId: uuid("replaced_with_reservation_id").references(
      () => reservation.id,
      { onDelete: "set null" },
    ),
    replacedWithGuestProfileId: uuid(
      "replaced_with_guest_profile_id",
    ).references(() => guestProfile.id, { onDelete: "set null" }),
    replacedAt: timestamp("replaced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_bookings_import_row_job").on(table.jobId),
    index("idx_bookings_import_row_source").on(table.sourceId),
    index("idx_bookings_import_row_job_status").on(table.jobId, table.status),
    index("idx_bookings_import_row_job_line").on(table.jobId, table.lineNumber),
    unique("uq_bookings_import_row_job_line").on(table.jobId, table.lineNumber),
    check(
      "bookings_import_row_end_after_start",
      sql`${table.endTime} IS NULL OR ${table.startTime} IS NULL OR ${table.endTime} > ${table.startTime}`,
    ),
  ],
);

export const BookingsImportRowSchema = createSelectSchema(bookingsImportRow);
export const InsertBookingsImportRowSchema =
  createInsertSchema(bookingsImportRow);

export type BookingsImportRowRecord = z.infer<typeof BookingsImportRowSchema>;
export type InsertBookingsImportRow = z.infer<
  typeof InsertBookingsImportRowSchema
>;
