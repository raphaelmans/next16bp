"use client";

import {
  getReservationRealtimeClient,
  type IReservationRealtimeClient,
  type ReservationEventRow,
  type ReservationRealtimeConnectionStatus,
} from "@/common/clients/reservation-realtime-client";

export type ReservationLifecycleStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

export type ReservationEventRole = "PLAYER" | "OWNER" | "SYSTEM";

export type ReservationRealtimeDomainEvent = {
  eventId: string;
  reservationId: string;
  reservationGroupId: string | null;
  fromStatus: ReservationLifecycleStatus | null;
  toStatus: ReservationLifecycleStatus;
  triggeredByRole: ReservationEventRole;
  occurredAt: string;
  sequenceCursor: string;
};

export interface ReservationRealtimeSubscription {
  unsubscribe: () => void;
}

export interface ReservationRealtimeSubscribeInput {
  reservationIds?: string[];
  onEvent: (event: ReservationRealtimeDomainEvent) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: ReservationRealtimeConnectionStatus) => void;
}

export interface IReservationRealtimeApi {
  subscribePlayer(
    input: ReservationRealtimeSubscribeInput,
  ): ReservationRealtimeSubscription;
  subscribeOwner(
    input: ReservationRealtimeSubscribeInput,
  ): ReservationRealtimeSubscription;
}

export type ReservationRealtimeApiDeps = {
  realtimeClient?: IReservationRealtimeClient;
};

const RESERVATION_STATUSES = new Set<ReservationLifecycleStatus>([
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
  "EXPIRED",
  "CANCELLED",
]);

const RESERVATION_EVENT_ROLES = new Set<ReservationEventRole>([
  "PLAYER",
  "OWNER",
  "SYSTEM",
]);

const mapStatus = (value: string | null): ReservationLifecycleStatus | null => {
  if (value === null) return null;
  return RESERVATION_STATUSES.has(value as ReservationLifecycleStatus)
    ? (value as ReservationLifecycleStatus)
    : null;
};

const mapRole = (value: string): ReservationEventRole | null =>
  RESERVATION_EVENT_ROLES.has(value as ReservationEventRole)
    ? (value as ReservationEventRole)
    : null;

const toIsoString = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const mapReservationEventRowToDomainEvent = (
  row: ReservationEventRow,
): ReservationRealtimeDomainEvent | null => {
  const toStatus = mapStatus(row.to_status);
  if (!toStatus) return null;
  const fromStatus = mapStatus(row.from_status);
  if (row.from_status !== null && !fromStatus) return null;

  const triggeredByRole = mapRole(row.triggered_by_role);
  if (!triggeredByRole) return null;

  if (fromStatus && fromStatus === toStatus) {
    return null;
  }

  const occurredAt = toIsoString(row.created_at);

  return {
    eventId: row.id,
    reservationId: row.reservation_id,
    reservationGroupId: null,
    fromStatus,
    toStatus,
    triggeredByRole,
    occurredAt,
    sequenceCursor: `${occurredAt}:${row.id}`,
  };
};

export class ReservationRealtimeApi implements IReservationRealtimeApi {
  constructor(private realtimeClient: IReservationRealtimeClient) {}

  private subscribe(
    input: ReservationRealtimeSubscribeInput,
  ): ReservationRealtimeSubscription {
    const scopedReservationIds = new Set(
      (input.reservationIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    );

    const subscription = this.realtimeClient.subscribeToReservationEvents({
      reservationIds: input.reservationIds,
      onInsert: (row) => {
        if (
          scopedReservationIds.size > 0 &&
          !scopedReservationIds.has(row.reservation_id)
        ) {
          return;
        }

        const event = mapReservationEventRowToDomainEvent(row);
        if (!event) return;
        input.onEvent(event);
      },
      onError: input.onError,
      onStatusChange: input.onStatusChange,
    });

    return {
      unsubscribe: subscription.unsubscribe,
    };
  }

  subscribePlayer(
    input: ReservationRealtimeSubscribeInput,
  ): ReservationRealtimeSubscription {
    return this.subscribe(input);
  }

  subscribeOwner(
    input: ReservationRealtimeSubscribeInput,
  ): ReservationRealtimeSubscription {
    return this.subscribe(input);
  }
}

export const createReservationRealtimeApi = (
  deps: ReservationRealtimeApiDeps = {},
): IReservationRealtimeApi =>
  new ReservationRealtimeApi(
    deps.realtimeClient ?? getReservationRealtimeClient(),
  );

const RESERVATION_REALTIME_API_SINGLETON = createReservationRealtimeApi();

export const getReservationRealtimeApi = () =>
  RESERVATION_REALTIME_API_SINGLETON;
