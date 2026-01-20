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
