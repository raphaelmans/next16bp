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
 * Court addon mode enum
 * OPTIONAL: selected by player
 * AUTO: applied when a rule window matches
 */
export const courtAddonModeEnum = pgEnum("court_addon_mode", [
  "OPTIONAL",
  "AUTO",
]);

/**
 * Court addon pricing type enum
 * HOURLY: charged per covered segment
 * FLAT: charged once per booking when overlapping
 */
export const courtAddonPricingTypeEnum = pgEnum("court_addon_pricing_type", [
  "HOURLY",
  "FLAT",
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
 * Organization member role enum
 * OWNER remains canonical at organization.ownerUserId and may be mirrored in membership contexts.
 */
export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "OWNER",
  "MANAGER",
  "VIEWER",
]);

/**
 * Organization member status enum
 */
export const organizationMemberStatusEnum = pgEnum(
  "organization_member_status",
  ["ACTIVE", "REVOKED"],
);

/**
 * Organization invitation status enum
 */
export const organizationInvitationStatusEnum = pgEnum(
  "organization_invitation_status",
  ["PENDING", "ACCEPTED", "DECLINED", "CANCELED", "EXPIRED"],
);

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
  ["EMAIL", "SMS", "WEB_PUSH", "MOBILE_PUSH"],
);

/**
 * Notification delivery job status enum
 * Tracks async delivery attempts for outbox jobs
 */
export const notificationDeliveryJobStatusEnum = pgEnum(
  "notification_delivery_job_status",
  ["PENDING", "SENDING", "SENT", "FAILED", "SKIPPED"],
);

/**
 * Open play status enum
 * Tracks the lifecycle of an open play session.
 */
export const openPlayStatusEnum = pgEnum("open_play_status", [
  "ACTIVE",
  "CLOSED",
  "CANCELLED",
]);

/**
 * Open play visibility enum
 * PUBLIC: discoverable in venue lists.
 * UNLISTED: accessible by link only.
 */
export const openPlayVisibilityEnum = pgEnum("open_play_visibility", [
  "PUBLIC",
  "UNLISTED",
]);

/**
 * Open play join policy enum
 * REQUEST: host approves participants.
 * AUTO: auto-confirm if capacity is available.
 */
export const openPlayJoinPolicyEnum = pgEnum("open_play_join_policy", [
  "REQUEST",
  "AUTO",
]);

/**
 * Open play participant role enum
 */
export const openPlayParticipantRoleEnum = pgEnum(
  "open_play_participant_role",
  ["HOST", "PLAYER"],
);

/**
 * Open play participant status enum
 */
export const openPlayParticipantStatusEnum = pgEnum(
  "open_play_participant_status",
  ["REQUESTED", "CONFIRMED", "WAITLISTED", "DECLINED", "LEFT"],
);

/**
 * Mobile push token platform enum
 * Identifies the mobile OS for Expo push tokens
 */
export const mobilePushTokenPlatformEnum = pgEnum(
  "mobile_push_token_platform",
  ["ios", "android"],
);

/**
 * Place addon mode enum
 * OPTIONAL: selected by player
 * AUTO: applied unconditionally
 */
export const placeAddonModeEnum = pgEnum("place_addon_mode", [
  "OPTIONAL",
  "AUTO",
]);

/**
 * Place addon pricing type enum
 * HOURLY: charged per covered segment
 * FLAT: charged once per booking unconditionally
 */
export const placeAddonPricingTypeEnum = pgEnum("place_addon_pricing_type", [
  "HOURLY",
  "FLAT",
]);
