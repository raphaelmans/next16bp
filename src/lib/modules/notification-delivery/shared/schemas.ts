import { z } from "zod";

export const verificationRequestedSchema = z.object({
  requestId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  organizationId: z.string(),
  organizationName: z.string().nullable().optional(),
  requestedByUserId: z.string(),
  requestNotes: z.string().nullable().optional(),
});

export const reservationCreatedSchema = z.object({
  reservationId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  courtId: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  playerName: z.string(),
  playerEmail: z.string().nullable().optional(),
  playerPhone: z.string().nullable().optional(),
  expiresAtIso: z.string().nullable().optional(),
});

export const reservationGroupItemSchema = z.object({
  reservationId: z.string(),
  courtId: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  expiresAtIso: z.string().nullable().optional(),
});

export const reservationGroupCreatedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  totalPriceCents: z.number(),
  currency: z.string(),
  playerName: z.string(),
  playerEmail: z.string().nullable().optional(),
  playerPhone: z.string().nullable().optional(),
  itemCount: z.number(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  items: z.array(reservationGroupItemSchema),
});

export const verificationReviewedSchema = z.object({
  requestId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().nullable().optional(),
});

export const claimReviewedSchema = z.object({
  requestId: z.string(),
  organizationId: z.string(),
  placeId: z.string(),
  placeName: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().nullable().optional(),
});

export const reservationAwaitingPaymentSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  totalPriceCents: z.number(),
  currency: z.string(),
});

export const reservationGroupAwaitingPaymentSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  expiresAtIso: z.string().nullable().optional(),
  totalPriceCents: z.number(),
  currency: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

export const reservationPaymentMarkedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
});

export const reservationGroupPaymentMarkedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

export const reservationConfirmedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
});

export const reservationGroupConfirmedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
});

export const reservationRejectedSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  reason: z.string().nullable().optional(),
});

export const reservationGroupRejectedSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
  reason: z.string().nullable().optional(),
});

export const reservationCancelledSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  reason: z.string().nullable().optional(),
});

export const reservationGroupCancelledSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  organizationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  playerName: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
  reason: z.string().nullable().optional(),
});

export const reservationCancelledByOwnerSchema = z.object({
  reservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  reason: z.string().nullable().optional(),
});

export const reservationGroupCancelledByOwnerSchema = z.object({
  reservationGroupId: z.string(),
  representativeReservationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  itemCount: z.number(),
  items: z.array(reservationGroupItemSchema),
  reason: z.string().nullable().optional(),
});

export const reservationPingOwnerSchema = z.object({
  reservationId: z.string(),
  organizationId: z.string(),
  placeName: z.string(),
  courtLabel: z.string(),
  playerName: z.string(),
  startTimeIso: z.string(),
  endTimeIso: z.string(),
});

export const testWebPushSchema = z.object({
  title: z.string(),
  body: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
});

export type VerificationRequestedPayload = z.infer<
  typeof verificationRequestedSchema
>;
export type ReservationCreatedPayload = z.infer<
  typeof reservationCreatedSchema
>;
export type ReservationGroupCreatedPayload = z.infer<
  typeof reservationGroupCreatedSchema
>;
export type VerificationReviewedPayload = z.infer<
  typeof verificationReviewedSchema
>;
export type ClaimReviewedPayload = z.infer<typeof claimReviewedSchema>;
export type ReservationAwaitingPaymentPayload = z.infer<
  typeof reservationAwaitingPaymentSchema
>;
export type ReservationGroupAwaitingPaymentPayload = z.infer<
  typeof reservationGroupAwaitingPaymentSchema
>;
export type ReservationPaymentMarkedPayload = z.infer<
  typeof reservationPaymentMarkedSchema
>;
export type ReservationGroupPaymentMarkedPayload = z.infer<
  typeof reservationGroupPaymentMarkedSchema
>;
export type ReservationConfirmedPayload = z.infer<
  typeof reservationConfirmedSchema
>;
export type ReservationGroupConfirmedPayload = z.infer<
  typeof reservationGroupConfirmedSchema
>;
export type ReservationRejectedPayload = z.infer<
  typeof reservationRejectedSchema
>;
export type ReservationGroupRejectedPayload = z.infer<
  typeof reservationGroupRejectedSchema
>;
export type ReservationCancelledPayload = z.infer<
  typeof reservationCancelledSchema
>;
export type ReservationGroupCancelledPayload = z.infer<
  typeof reservationGroupCancelledSchema
>;
export type ReservationCancelledByOwnerPayload = z.infer<
  typeof reservationCancelledByOwnerSchema
>;
export type ReservationGroupCancelledByOwnerPayload = z.infer<
  typeof reservationGroupCancelledByOwnerSchema
>;
export type ReservationPingOwnerPayload = z.infer<
  typeof reservationPingOwnerSchema
>;
export type TestWebPushPayload = z.infer<typeof testWebPushSchema>;

export type NotificationEventType =
  | "place_verification.requested"
  | "reservation.created"
  | "reservation_group.created"
  | "place_verification.approved"
  | "place_verification.rejected"
  | "claim_request.approved"
  | "claim_request.rejected"
  | "reservation.awaiting_payment"
  | "reservation_group.awaiting_payment"
  | "reservation.payment_marked"
  | "reservation_group.payment_marked"
  | "reservation.confirmed"
  | "reservation_group.confirmed"
  | "reservation.rejected"
  | "reservation_group.rejected"
  | "reservation.cancelled"
  | "reservation_group.cancelled"
  | "reservation.cancelled_by_owner"
  | "reservation_group.cancelled_by_owner"
  | "reservation.ping_owner"
  | "test.web_push";
