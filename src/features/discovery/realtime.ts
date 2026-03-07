"use client";

import { useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { produce } from "immer";
import { useEffect } from "react";
import {
  type AvailabilityChangeEventRow,
  getAvailabilityRealtimeClient,
} from "@/common/clients/availability-realtime-client";
import {
  availabilityQueryKeys,
  normalizeAvailabilityCourtDayInput,
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportDayInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";

type AvailabilityResultLike = {
  options: Array<{
    startTime: string;
    endTime: string;
    totalPriceCents: number;
    currency: string | null;
    courtId: string;
    courtLabel?: string;
    status: "AVAILABLE" | "BOOKED";
    unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  }>;
  diagnostics: {
    hasHoursWindows: boolean;
    hasRateRules: boolean;
    dayHasHours: boolean;
    allSlotsBooked: boolean;
    reservationsDisabled: boolean;
  };
};

const availabilityRealtimeClient = getAvailabilityRealtimeClient();

const rangesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) => new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);

export const patchCourtAvailabilityResult = (
  current: AvailabilityResultLike | undefined,
  event: AvailabilityChangeEventRow,
) => {
  if (!current) return current;

  return produce(current, (draft) => {
    const existingIndex = draft.options.findIndex(
      (option) =>
        option.courtId === event.court_id &&
        option.startTime === event.start_time &&
        option.endTime === event.end_time,
    );

    const nextOption = {
      startTime: event.start_time,
      endTime: event.end_time,
      totalPriceCents: event.total_price_cents ?? 0,
      currency: event.currency,
      courtId: event.court_id,
      courtLabel: "",
      status: event.slot_status as "AVAILABLE" | "BOOKED",
      unavailableReason: event.unavailable_reason as
        | "RESERVATION"
        | "MAINTENANCE"
        | "WALK_IN"
        | null,
    };

    if (existingIndex >= 0) {
      const existing = draft.options[existingIndex];
      draft.options[existingIndex] = {
        ...existing,
        status: nextOption.status,
        unavailableReason: nextOption.unavailableReason,
        totalPriceCents: event.total_price_cents ?? existing.totalPriceCents,
        currency: event.currency ?? existing.currency,
      };
    } else if (event.total_price_cents !== null && event.currency) {
      draft.options.push(nextOption);
      draft.options.sort((left, right) =>
        left.startTime.localeCompare(right.startTime),
      );
    }

    const totalSlots = draft.options.length;
    const bookedSlots = draft.options.filter(
      (option) => option.status === "BOOKED",
    ).length;
    draft.diagnostics.allSlotsBooked =
      totalSlots > 0 && bookedSlots === totalSlots;
  });
};

export function useModDiscoveryAvailabilityRealtimeSync(options: {
  enabled: boolean;
  courtDayInput?: {
    courtId: string;
    date: string;
    durationMinutes: number;
    includeUnavailable?: boolean;
    selectedAddons?: { addonId: string; quantity: number }[];
  };
  courtRangeInput?: {
    courtId: string;
    startDate: string;
    endDate: string;
    durationMinutes: number;
    includeUnavailable?: boolean;
    selectedAddons?: { addonId: string; quantity: number }[];
  };
  placeSportDayInput?: {
    placeId: string;
    sportId: string;
    date: string;
    durationMinutes: number;
    includeUnavailable?: boolean;
    includeCourtOptions?: boolean;
    selectedAddons?: { addonId: string; quantity: number }[];
  };
  placeSportRangeInput?: {
    placeId: string;
    sportId: string;
    startDate: string;
    endDate: string;
    durationMinutes: number;
    includeUnavailable?: boolean;
    includeCourtOptions?: boolean;
    selectedAddons?: { addonId: string; quantity: number }[];
  };
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const courtId =
      options.courtDayInput?.courtId ?? options.courtRangeInput?.courtId;
    const placeId =
      options.placeSportDayInput?.placeId ??
      options.placeSportRangeInput?.placeId;

    const subscription =
      availabilityRealtimeClient.subscribeToAvailabilityChangeEvents({
        courtId,
        placeId,
        onInsert: (event) => {
          if (options.courtDayInput) {
            const normalized = normalizeAvailabilityCourtDayInput(
              options.courtDayInput,
            );
            const queryStart = normalized.date;
            const queryEnd = addDays(
              new Date(normalized.date),
              1,
            ).toISOString();
            if (
              event.court_id === normalized.courtId &&
              rangesOverlap(
                queryStart,
                queryEnd,
                event.start_time,
                event.end_time,
              )
            ) {
              queryClient.setQueryData(
                availabilityQueryKeys.courtDay(normalized),
                (current: AvailabilityResultLike | undefined) =>
                  patchCourtAvailabilityResult(current, event),
              );
            }
          }

          if (options.courtRangeInput) {
            const normalized = normalizeAvailabilityCourtRangeInput(
              options.courtRangeInput,
            );
            if (
              event.court_id === normalized.courtId &&
              rangesOverlap(
                normalized.startDate,
                normalized.endDate,
                event.start_time,
                event.end_time,
              )
            ) {
              queryClient.setQueryData(
                availabilityQueryKeys.courtRange(normalized),
                (current: AvailabilityResultLike | undefined) =>
                  patchCourtAvailabilityResult(current, event),
              );
            }
          }

          if (options.placeSportDayInput) {
            const normalized = normalizeAvailabilityPlaceSportDayInput(
              options.placeSportDayInput,
            );
            const queryEnd = addDays(
              new Date(normalized.date),
              1,
            ).toISOString();
            if (
              event.place_id === normalized.placeId &&
              event.sport_id === normalized.sportId &&
              rangesOverlap(
                normalized.date,
                queryEnd,
                event.start_time,
                event.end_time,
              )
            ) {
              void queryClient.invalidateQueries({
                queryKey: availabilityQueryKeys.placeSportDay(normalized),
              });
            }
          }

          if (options.placeSportRangeInput) {
            const normalized = normalizeAvailabilityPlaceSportRangeInput(
              options.placeSportRangeInput,
            );
            if (
              event.place_id === normalized.placeId &&
              event.sport_id === normalized.sportId &&
              rangesOverlap(
                normalized.startDate,
                normalized.endDate,
                event.start_time,
                event.end_time,
              )
            ) {
              void queryClient.invalidateQueries({
                queryKey: availabilityQueryKeys.placeSportRange(normalized),
              });
            }
          }
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [options, queryClient]);
}
