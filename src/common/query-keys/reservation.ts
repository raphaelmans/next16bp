"use client";

import { buildTrpcQueryKey } from "@/common/trpc-client-call";
import { normalizeString, serializeStableScope } from "./shared";

export type ReservationBackendStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

type OwnerReservationScopeInput = {
  organizationId: string;
  reservationId?: string;
  placeId?: string;
  courtId?: string;
  status?: ReservationBackendStatus;
  statuses?: ReservationBackendStatus[];
  timeBucket?: "past" | "upcoming";
  limit?: number;
  offset?: number;
};

type PlayerReservationSummaryScopeInput = {
  status?: ReservationBackendStatus;
  limit?: number;
  offset?: number;
};

export const normalizeOwnerReservationScopeInput = (
  input: OwnerReservationScopeInput,
) => ({
  organizationId: normalizeString(input.organizationId) ?? "",
  reservationId: normalizeString(input.reservationId),
  placeId: normalizeString(input.placeId),
  courtId: normalizeString(input.courtId),
  status: normalizeString(input.status) as ReservationBackendStatus | undefined,
  statuses: input.statuses
    ?.map((status) => normalizeString(status) as ReservationBackendStatus)
    .filter(Boolean),
  timeBucket: normalizeString(
    input.timeBucket,
  ) as OwnerReservationScopeInput["timeBucket"],
  limit: input.limit ?? 100,
  offset: input.offset ?? 0,
});

export const normalizePlayerReservationSummaryScopeInput = (
  input: PlayerReservationSummaryScopeInput,
) => ({
  status: normalizeString(input.status) as ReservationBackendStatus | undefined,
  limit: input.limit ?? 100,
  offset: input.offset ?? 0,
});

export const buildReservationScopeKey = (value: unknown) =>
  serializeStableScope(value);

export const reservationQueryKeys = {
  ownerSummaries: (input: OwnerReservationScopeInput) =>
    buildTrpcQueryKey(
      ["reservationOwner", "getForOrganization"],
      normalizeOwnerReservationScopeInput(input),
    ),
  ownerPendingCount: (organizationId: string) =>
    buildTrpcQueryKey(["reservationOwner", "getPendingCount"], {
      organizationId: normalizeString(organizationId) ?? "",
    }),
  ownerLinkedDetail: (reservationId: string) =>
    buildTrpcQueryKey(["reservationOwner", "getLinkedDetail"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  ownerHistory: (reservationId: string) =>
    buildTrpcQueryKey(["audit", "reservationHistory"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  ownerActiveForCourtRange: (input: {
    courtId: string;
    startTime: string;
    endTime: string;
  }) =>
    buildTrpcQueryKey(["reservationOwner", "getActiveForCourtRange"], {
      courtId: normalizeString(input.courtId) ?? "",
      startTime: normalizeString(input.startTime) ?? "",
      endTime: normalizeString(input.endTime) ?? "",
    }),
  playerSummaries: (input: PlayerReservationSummaryScopeInput) =>
    buildTrpcQueryKey(
      ["reservation", "getMyWithDetails"],
      normalizePlayerReservationSummaryScopeInput(input),
    ),
  playerDetail: (reservationId: string) =>
    buildTrpcQueryKey(["reservation", "getDetail"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  playerLinkedDetail: (reservationId: string) =>
    buildTrpcQueryKey(["reservation", "getLinkedDetail"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  playerById: (reservationId: string) =>
    buildTrpcQueryKey(["reservation", "getById"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  chatSession: (reservationId: string) =>
    buildTrpcQueryKey(["reservationChat", "getSession"], {
      reservationId: normalizeString(reservationId) ?? "",
    }),
  notificationInbox: (input?: { limit?: number; offset?: number }) =>
    buildTrpcQueryKey(["userNotification", "listMy"], {
      limit: input?.limit ?? 20,
      offset: input?.offset ?? 0,
    }),
  notificationUnreadCount: () =>
    buildTrpcQueryKey(["userNotification", "unreadCount"]),
};
