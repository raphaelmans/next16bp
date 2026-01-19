import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { claimRequestStatusEnum, claimRequestTypeEnum } from "./enums";
import { organization } from "./organization";
import { place } from "./place";

/**
 * Claim Request table
 * Tracks requests to claim or remove curated places
 */
export const claimRequest = pgTable(
  "claim_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    requestType: claimRequestTypeEnum("request_type").notNull(),
    status: claimRequestStatusEnum("status").notNull().default("PENDING"),
    requestedByUserId: uuid("requested_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "cascade",
      },
    ),
    reviewerUserId: uuid("reviewer_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    requestNotes: text("request_notes"),
    reviewNotes: text("review_notes"),
    guestName: varchar("guest_name", { length: 150 }),
    guestEmail: varchar("guest_email", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_claim_request_guest_email").on(table.guestEmail),
    index("idx_claim_request_org").on(table.organizationId),
    index("idx_claim_request_requested_by")
      .on(table.requestedByUserId)
      .where(sql`${table.requestedByUserId} IS NOT NULL`),
  ],
);

export const ClaimRequestSchema = createSelectSchema(claimRequest);
export const InsertClaimRequestSchema = createInsertSchema(claimRequest);

export type ClaimRequestRecord = z.infer<typeof ClaimRequestSchema>;
export type InsertClaimRequest = z.infer<typeof InsertClaimRequestSchema>;

/**
 * Claim Request Event table (Audit Log)
 * Tracks all claim request status transitions
 */
export const claimRequestEvent = pgTable(
  "claim_request_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimRequestId: uuid("claim_request_id")
      .notNull()
      .references(() => claimRequest.id, { onDelete: "cascade" }),
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
    index("idx_claim_request_event_claim").on(table.claimRequestId),
    index("idx_claim_request_event_trigger")
      .on(table.triggeredByUserId)
      .where(sql`${table.triggeredByUserId} IS NOT NULL`),
  ],
);

export const ClaimRequestEventSchema = createSelectSchema(claimRequestEvent);
export const InsertClaimRequestEventSchema =
  createInsertSchema(claimRequestEvent);

export type ClaimRequestEventRecord = z.infer<typeof ClaimRequestEventSchema>;
export type InsertClaimRequestEvent = z.infer<
  typeof InsertClaimRequestEventSchema
>;
