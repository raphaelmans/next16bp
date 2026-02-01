import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Place type enum
 * Defines whether a place is curated (view-only) or reservable (bookable)
 */
export const placeTypeEnum = pgEnum("place_type", ["CURATED", "RESERVABLE"]);

/**
 * Place claim status enum
 * Tracks the claiming lifecycle of a place
 */
export const placeClaimStatusEnum = pgEnum("claim_status", [
  "UNCLAIMED",
  "CLAIM_PENDING",
  "CLAIMED",
  "REMOVAL_REQUESTED",
]);

/**
 * Reservation status enum
 * Tracks the lifecycle of a reservation
 */
export const reservationStatusEnum = pgEnum("reservation_status", [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
  "EXPIRED",
  "CANCELLED",
]);

/**
 * Court block type enum
 * Distinguishes maintenance vs walk-in blocks
 */
export const courtBlockTypeEnum = pgEnum("court_block_type", [
  "MAINTENANCE",
  "WALK_IN",
]);

/**
 * Triggered by role enum
 * Identifies who triggered a status transition in audit logs
 */
export const triggeredByRoleEnum = pgEnum("triggered_by_role", [
  "PLAYER",
  "OWNER",
  "SYSTEM",
]);

/**
 * Default portal enum
 * Stores the user's preferred portal after login
 */
export const defaultPortalEnum = pgEnum("default_portal", ["player", "owner"]);

/**
 * Claim request type enum
 * Defines the type of claim request
 */
export const claimRequestTypeEnum = pgEnum("claim_request_type", [
  "CLAIM",
  "REMOVAL",
]);

/**
 * Claim request status enum
 * Tracks the review status of a claim request
 */
export const claimRequestStatusEnum = pgEnum("claim_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

/**
 * Payment method type enum
 * Defines supported payment rails for P2P payments
 */
export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "MOBILE_WALLET",
  "BANK",
]);

/**
 * Payment method provider enum (PH-only)
 * Stores wallet/bank provider identifiers
 */
export const paymentMethodProviderEnum = pgEnum("payment_method_provider", [
  "GCASH",
  "MAYA",
  "BPI",
  "BDO",
  "METROBANK",
  "UNIONBANK",
  "RCBC",
  "LANDBANK",
  "SECURITY_BANK",
  "CHINABANK",
  "PNB",
  "EASTWEST",
]);

/**
 * Place verification status enum
 * Tracks if a place is verified for reservations.
 */
export const placeVerificationStatusEnum = pgEnum("place_verification_status", [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

/**
 * Bookings import job status enum
 * Tracks the lifecycle of an import job
 */
export const bookingsImportJobStatusEnum = pgEnum(
  "bookings_import_job_status",
  [
    "DRAFT",
    "NORMALIZING",
    "NORMALIZED",
    "COMMITTING",
    "COMMITTED",
    "FAILED",
    "DISCARDED",
  ],
);

/**
 * Bookings import source type enum
 * The file format/source of the import
 */
export const bookingsImportSourceTypeEnum = pgEnum(
  "bookings_import_source_type",
  ["ics", "csv", "xlsx", "image"],
);

/**
 * Bookings import row status enum
 * Tracks the validation/commit state of individual rows
 */
export const bookingsImportRowStatusEnum = pgEnum(
  "bookings_import_row_status",
  ["PENDING", "VALID", "ERROR", "WARNING", "COMMITTED", "SKIPPED"],
);

/**
 * Notification delivery channel enum
 * Defines how notifications are delivered (email or sms)
 */
export const notificationDeliveryChannelEnum = pgEnum(
  "notification_delivery_channel",
  ["EMAIL", "SMS"],
);

/**
 * Notification delivery job status enum
 * Tracks async delivery attempts for outbox jobs
 */
export const notificationDeliveryJobStatusEnum = pgEnum(
  "notification_delivery_job_status",
  ["PENDING", "SENDING", "SENT", "FAILED", "SKIPPED"],
);
