"use client";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/common/clients/supabase-browser-client";

export type ReservationRealtimeConnectionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

export type ReservationEventRow = {
  id: string;
  reservation_id: string;
  from_status: string | null;
  to_status: string;
  triggered_by_role: string;
  created_at: string;
};

export interface ReservationRealtimeClientSubscription {
  channelName: string;
  unsubscribe: () => void;
}

export interface SubscribeReservationEventsInput {
  reservationIds?: string[];
  onInsert: (row: ReservationEventRow) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: ReservationRealtimeConnectionStatus) => void;
}

export interface IReservationRealtimeClient {
  subscribeToReservationEvents(
    input: SubscribeReservationEventsInput,
  ): ReservationRealtimeClientSubscription;
}

const RESERVATION_EVENT_SCHEMA = "public";
const RESERVATION_EVENT_TABLE = "reservation_event";

const CONNECTION_STATUSES = new Set<ReservationRealtimeConnectionStatus>([
  "SUBSCRIBED",
  "TIMED_OUT",
  "CLOSED",
  "CHANNEL_ERROR",
]);

const sanitizeReservationIds = (reservationIds?: string[]) =>
  Array.from(
    new Set(
      (reservationIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  );

const buildReservationIdFilter = (reservationIds?: string[]) => {
  const ids = sanitizeReservationIds(reservationIds);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return `reservation_id=eq.${ids[0]}`;
  return `reservation_id=in.(${ids.join(",")})`;
};

const isReservationRealtimeConnectionStatus = (
  value: string,
): value is ReservationRealtimeConnectionStatus =>
  CONNECTION_STATUSES.has(value as ReservationRealtimeConnectionStatus);

const isReservationEventRow = (
  value: unknown,
): value is ReservationEventRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.reservation_id === "string" &&
    (typeof row.from_status === "string" || row.from_status === null) &&
    typeof row.to_status === "string" &&
    typeof row.triggered_by_role === "string" &&
    typeof row.created_at === "string"
  );
};

const createChannelName = () =>
  `reservation-event-stream:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const subscribeToReservationEvents = (
  input: SubscribeReservationEventsInput,
): ReservationRealtimeClientSubscription => {
  const supabase = getSupabaseBrowserClient();
  const channelName = createChannelName();
  const filter = buildReservationIdFilter(input.reservationIds);

  let channel: RealtimeChannel | null = supabase.channel(channelName);

  channel = channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: RESERVATION_EVENT_SCHEMA,
      table: RESERVATION_EVENT_TABLE,
      ...(filter ? { filter } : {}),
    },
    (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
      const row = payload.new;
      if (!isReservationEventRow(row)) {
        input.onError?.(
          new Error("Invalid reservation_event realtime payload received"),
        );
        return;
      }
      input.onInsert(row);
    },
  );

  channel.subscribe((status, error) => {
    if (error) {
      input.onError?.(error);
      return;
    }

    if (isReservationRealtimeConnectionStatus(status)) {
      input.onStatusChange?.(status);
      return;
    }

    input.onError?.(
      new Error(`Unknown realtime subscription status: ${String(status)}`),
    );
  });

  return {
    channelName,
    unsubscribe: () => {
      if (!channel) return;
      void supabase.removeChannel(channel);
      channel = null;
    },
  };
};

export class ReservationRealtimeClient implements IReservationRealtimeClient {
  subscribeToReservationEvents(
    input: SubscribeReservationEventsInput,
  ): ReservationRealtimeClientSubscription {
    return subscribeToReservationEvents(input);
  }
}

export type ReservationRealtimeClientDeps = {
  client?: IReservationRealtimeClient;
};

export const createReservationRealtimeClient = (
  deps: ReservationRealtimeClientDeps = {},
): IReservationRealtimeClient => deps.client ?? new ReservationRealtimeClient();

const RESERVATION_REALTIME_CLIENT_SINGLETON = createReservationRealtimeClient();

export const getReservationRealtimeClient = () =>
  RESERVATION_REALTIME_CLIENT_SINGLETON;
