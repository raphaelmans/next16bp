import {
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
import { bookingsImportSourceTypeEnum } from "./enums";

/**
 * Bookings Import Source table
 * Represents individual files uploaded to an import job.
 */
export const bookingsImportSource = pgTable(
  "bookings_import_source",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => bookingsImportJob.id, { onDelete: "cascade" }),
    sourceType: bookingsImportSourceTypeEnum("source_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    filePath: text("file_path").notNull(),
    sortOrder: integer("sort_order").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_bookings_import_source_job").on(table.jobId),
    unique("uq_bookings_import_source_job_sort").on(
      table.jobId,
      table.sortOrder,
    ),
  ],
);

export const BookingsImportSourceSchema =
  createSelectSchema(bookingsImportSource);
export const InsertBookingsImportSourceSchema =
  createInsertSchema(bookingsImportSource);

export type BookingsImportSourceRecord = z.infer<
  typeof BookingsImportSourceSchema
>;
export type InsertBookingsImportSource = z.infer<
  typeof InsertBookingsImportSourceSchema
>;
