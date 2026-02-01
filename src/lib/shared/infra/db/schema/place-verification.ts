import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { claimRequestStatusEnum, placeVerificationStatusEnum } from "./enums";
import { organization } from "./organization";
import { place } from "./place";

/**
 * Place Verification table
 * Controls whether a place is verified and bookable.
 */
export const placeVerification = pgTable(
  "place_verification",
  {
    placeId: uuid("place_id")
      .primaryKey()
      .references(() => place.id, { onDelete: "cascade" }),
    status: placeVerificationStatusEnum("status")
      .notNull()
      .default("UNVERIFIED"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "set null",
      },
    ),
    reservationsEnabled: boolean("reservations_enabled")
      .notNull()
      .default(false),
    reservationsEnabledAt: timestamp("reservations_enabled_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "place_verification_requires_verified",
      sql`${table.reservationsEnabled} = false OR ${table.status} = 'VERIFIED'`,
    ),
  ],
);

export const PlaceVerificationSchema = createSelectSchema(placeVerification);
export const InsertPlaceVerificationSchema =
  createInsertSchema(placeVerification);

export type PlaceVerificationRecord = z.infer<typeof PlaceVerificationSchema>;
export type InsertPlaceVerification = z.infer<
  typeof InsertPlaceVerificationSchema
>;

/**
 * Place Verification Request table
 * Tracks owner-submitted verification requests for admin review.
 */
export const placeVerificationRequest = pgTable(
  "place_verification_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    status: claimRequestStatusEnum("status").notNull().default("PENDING"),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    reviewerUserId: uuid("reviewer_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    requestNotes: text("request_notes"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_place_verification_request_place").on(table.placeId),
    index("idx_place_verification_request_org").on(table.organizationId),
    index("idx_place_verification_request_status").on(table.status),
    uniqueIndex("place_verification_request_pending")
      .on(table.placeId)
      .where(sql`${table.status} = 'PENDING'`),
  ],
);

export const PlaceVerificationRequestSchema = createSelectSchema(
  placeVerificationRequest,
);
export const InsertPlaceVerificationRequestSchema = createInsertSchema(
  placeVerificationRequest,
);

export type PlaceVerificationRequestRecord = z.infer<
  typeof PlaceVerificationRequestSchema
>;
export type InsertPlaceVerificationRequest = z.infer<
  typeof InsertPlaceVerificationRequestSchema
>;

/**
 * Place Verification Request Event table (Audit Log)
 * Tracks all status transitions.
 */
export const placeVerificationRequestEvent = pgTable(
  "place_verification_request_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeVerificationRequestId: uuid("place_verification_request_id")
      .notNull()
      .references(() => placeVerificationRequest.id, { onDelete: "cascade" }),
    fromStatus: varchar("from_status", { length: 20 }),
    toStatus: varchar("to_status", { length: 20 }).notNull(),
    triggeredByUserId: uuid("triggered_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "set null",
      },
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_place_verification_request_event_request").on(
      table.placeVerificationRequestId,
    ),
    index("idx_place_verification_request_event_trigger")
      .on(table.triggeredByUserId)
      .where(sql`${table.triggeredByUserId} IS NOT NULL`),
  ],
);

export const PlaceVerificationRequestEventSchema = createSelectSchema(
  placeVerificationRequestEvent,
);
export const InsertPlaceVerificationRequestEventSchema = createInsertSchema(
  placeVerificationRequestEvent,
);

export type PlaceVerificationRequestEventRecord = z.infer<
  typeof PlaceVerificationRequestEventSchema
>;
export type InsertPlaceVerificationRequestEvent = z.infer<
  typeof InsertPlaceVerificationRequestEventSchema
>;

/**
 * Place Verification Request Document table
 * Stores uploaded verification documents.
 */
export const placeVerificationRequestDocument = pgTable(
  "place_verification_request_document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeVerificationRequestId: uuid("place_verification_request_id")
      .notNull()
      .references(() => placeVerificationRequest.id, { onDelete: "cascade" }),
    fileUrl: text("file_url"),
    filePath: text("file_path"),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileName: varchar("file_name", { length: 255 }),
    sizeBytes: integer("size_bytes"),
    docType: varchar("doc_type", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_place_verification_document_request").on(
      table.placeVerificationRequestId,
    ),
  ],
);

export const PlaceVerificationRequestDocumentSchema = createSelectSchema(
  placeVerificationRequestDocument,
);
export const InsertPlaceVerificationRequestDocumentSchema = createInsertSchema(
  placeVerificationRequestDocument,
);

export type PlaceVerificationRequestDocumentRecord = z.infer<
  typeof PlaceVerificationRequestDocumentSchema
>;
export type InsertPlaceVerificationRequestDocument = z.infer<
  typeof InsertPlaceVerificationRequestDocumentSchema
>;
