import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
  notificationDeliveryChannelEnum,
  notificationDeliveryJobStatusEnum,
} from "./enums";
import { organization } from "./organization";
import { placeVerificationRequest } from "./place-verification";
import { reservation } from "./reservation";

/**
 * Notification delivery job table
 * Outbox queue for async delivery (email + sms)
 */
export const notificationDeliveryJob = pgTable(
  "notification_delivery_job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    channel: notificationDeliveryChannelEnum("channel").notNull(),
    target: text("target"),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    reservationId: uuid("reservation_id").references(() => reservation.id, {
      onDelete: "set null",
    }),
    placeVerificationRequestId: uuid(
      "place_verification_request_id",
    ).references(() => placeVerificationRequest.id, { onDelete: "set null" }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    status: notificationDeliveryJobStatusEnum("status")
      .notNull()
      .default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lastError: text("last_error"),
    providerMessageId: text("provider_message_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_notification_delivery_job_idempotency").on(
      table.idempotencyKey,
    ),
    index("idx_notification_delivery_job_status_next_attempt").on(
      table.status,
      table.nextAttemptAt,
    ),
    index("idx_notification_delivery_job_event_created").on(
      table.eventType,
      table.createdAt,
    ),
    index("idx_notification_delivery_job_org").on(table.organizationId),
    index("idx_notification_delivery_job_request").on(
      table.placeVerificationRequestId,
    ),
  ],
);

export const NotificationDeliveryJobSchema = createSelectSchema(
  notificationDeliveryJob,
);
export const InsertNotificationDeliveryJobSchema = createInsertSchema(
  notificationDeliveryJob,
);

export type NotificationDeliveryJobRecord = z.infer<
  typeof NotificationDeliveryJobSchema
>;
export type InsertNotificationDeliveryJob = z.infer<
  typeof InsertNotificationDeliveryJobSchema
>;
