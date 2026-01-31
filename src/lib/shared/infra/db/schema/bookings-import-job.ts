import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
  bookingsImportJobStatusEnum,
  bookingsImportSourceTypeEnum,
} from "./enums";
import { organization } from "./organization";
import { place } from "./place";

/**
 * Bookings Import Job table
 * Tracks an import session from upload through normalization to commit.
 */
export const bookingsImportJob = pgTable(
  "bookings_import_job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    sourceType: bookingsImportSourceTypeEnum("source_type").notNull(),
    status: bookingsImportJobStatusEnum("status").notNull().default("DRAFT"),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    filePath: text("file_path").notNull(),
    rowCount: integer("row_count"),
    validRowCount: integer("valid_row_count"),
    errorRowCount: integer("error_row_count"),
    committedRowCount: integer("committed_row_count"),
    errorMessage: text("error_message"),
    aiUsedAt: timestamp("ai_used_at", { withTimezone: true }),
    normalizedAt: timestamp("normalized_at", { withTimezone: true }),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    discardedAt: timestamp("discarded_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_bookings_import_job_place").on(table.placeId),
    index("idx_bookings_import_job_org").on(table.organizationId),
    index("idx_bookings_import_job_user").on(table.userId),
    index("idx_bookings_import_job_status").on(table.status),
    index("idx_bookings_import_job_place_created").on(
      table.placeId,
      table.createdAt,
    ),
  ],
);

export const BookingsImportJobSchema = createSelectSchema(bookingsImportJob);
export const InsertBookingsImportJobSchema =
  createInsertSchema(bookingsImportJob);

export type BookingsImportJobRecord = z.infer<typeof BookingsImportJobSchema>;
export type InsertBookingsImportJob = z.infer<
  typeof InsertBookingsImportJobSchema
>;
