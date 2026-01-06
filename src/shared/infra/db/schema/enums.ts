import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Court type enum
 * Defines whether a court is curated (view-only) or reservable (bookable)
 */
export const courtTypeEnum = pgEnum("court_type", ["CURATED", "RESERVABLE"]);

/**
 * Claim status enum
 * Tracks the claiming lifecycle of a court
 */
export const claimStatusEnum = pgEnum("claim_status", [
  "UNCLAIMED",
  "CLAIM_PENDING",
  "CLAIMED",
  "REMOVAL_REQUESTED",
]);

/**
 * Time slot status enum
 * Tracks the availability state of a time slot
 */
export const timeSlotStatusEnum = pgEnum("time_slot_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
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
 * Triggered by role enum
 * Identifies who triggered a status transition in audit logs
 */
export const triggeredByRoleEnum = pgEnum("triggered_by_role", [
  "PLAYER",
  "OWNER",
  "SYSTEM",
]);

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
