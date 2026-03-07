"use client";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/common/clients/supabase-browser-client";

export type AvailabilityRealtimeConnectionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

export type AvailabilityChangeEventRow = {
  id: string;
  source_kind: string;
  source_event: string;
  source_id: string;
  court_id: string;
  place_id: string;
  sport_id: string;
  start_time: string;
  end_time: string;
  slot_status: string;
  unavailable_reason: string | null;
  total_price_cents: number | null;
  currency: string | null;
  created_at: string;
};

export interface AvailabilityRealtimeClientSubscription {
  channelName: string;
  unsubscribe: () => void;
}

export interface SubscribeAvailabilityChangeEventsInput {
  courtId?: string;
  placeId?: string;
  onInsert: (row: AvailabilityChangeEventRow) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: AvailabilityRealtimeConnectionStatus) => void;
}

export interface IAvailabilityRealtimeClient {
  subscribeToAvailabilityChangeEvents(
    input: SubscribeAvailabilityChangeEventsInput,
  ): AvailabilityRealtimeClientSubscription;
}

const AVAILABILITY_CHANGE_EVENT_TABLE = "availability_change_event";

const CONNECTION_STATUSES = new Set<AvailabilityRealtimeConnectionStatus>([
  "SUBSCRIBED",
  "TIMED_OUT",
  "CLOSED",
  "CHANNEL_ERROR",
]);

const buildFilter = (input: SubscribeAvailabilityChangeEventsInput) => {
  if (input.courtId?.trim()) {
    return `court_id=eq.${input.courtId.trim()}`;
  }
  if (input.placeId?.trim()) {
    return `place_id=eq.${input.placeId.trim()}`;
  }
  return undefined;
};

const isAvailabilityRealtimeConnectionStatus = (
  value: string,
): value is AvailabilityRealtimeConnectionStatus =>
  CONNECTION_STATUSES.has(value as AvailabilityRealtimeConnectionStatus);

const isAvailabilityChangeEventRow = (
  value: unknown,
): value is AvailabilityChangeEventRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.court_id === "string" &&
    typeof row.place_id === "string" &&
    typeof row.sport_id === "string" &&
    typeof row.start_time === "string" &&
    typeof row.end_time === "string" &&
    typeof row.slot_status === "string" &&
    typeof row.created_at === "string"
  );
};

const createChannelName = () =>
  `availability-change-stream:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export class AvailabilityRealtimeClient implements IAvailabilityRealtimeClient {
  subscribeToAvailabilityChangeEvents(
    input: SubscribeAvailabilityChangeEventsInput,
  ): AvailabilityRealtimeClientSubscription {
    const supabase = getSupabaseBrowserClient();
    const channelName = createChannelName();
    const filter = buildFilter(input);
    let channel: RealtimeChannel | null = supabase.channel(channelName);

    channel = channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: AVAILABILITY_CHANGE_EVENT_TABLE,
        ...(filter ? { filter } : {}),
      },
      (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
        const row = payload.new;
        if (!isAvailabilityChangeEventRow(row)) {
          input.onError?.(
            new Error("Invalid availability_change_event realtime payload"),
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

      if (isAvailabilityRealtimeConnectionStatus(status)) {
        input.onStatusChange?.(status);
      }
    });

    return {
      channelName,
      unsubscribe: () => {
        if (!channel) return;
        void supabase.removeChannel(channel);
        channel = null;
      },
    };
  }
}

const AVAILABILITY_REALTIME_CLIENT_SINGLETON = new AvailabilityRealtimeClient();

export const getAvailabilityRealtimeClient = () =>
  AVAILABILITY_REALTIME_CLIENT_SINGLETON;
