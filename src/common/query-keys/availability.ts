"use client";

import { buildTrpcQueryKey } from "@/common/trpc-client-call";
import {
  type AddonSelectionInput,
  normalizeAddonSelections,
  normalizeBoolean,
  normalizeString,
  serializeStableScope,
} from "./shared";

type AvailabilityCourtDayInput = {
  courtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  selectedAddons?: AddonSelectionInput[];
};

type AvailabilityCourtRangeInput = {
  courtId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  selectedAddons?: AddonSelectionInput[];
};

type AvailabilityPlaceSportDayInput = {
  placeId: string;
  sportId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  includeCourtOptions?: boolean;
  selectedAddons?: AddonSelectionInput[];
};

type AvailabilityPlaceSportRangeInput = {
  placeId: string;
  sportId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  includeCourtOptions?: boolean;
  selectedAddons?: AddonSelectionInput[];
};

export const normalizeAvailabilityCourtDayInput = (
  input: AvailabilityCourtDayInput,
) => ({
  courtId: normalizeString(input.courtId) ?? "",
  date: normalizeString(input.date) ?? "",
  durationMinutes: input.durationMinutes,
  includeUnavailable: normalizeBoolean(input.includeUnavailable, false),
  selectedAddons: normalizeAddonSelections(input.selectedAddons),
});

export const normalizeAvailabilityCourtRangeInput = (
  input: AvailabilityCourtRangeInput,
) => ({
  courtId: normalizeString(input.courtId) ?? "",
  startDate: normalizeString(input.startDate) ?? "",
  endDate: normalizeString(input.endDate) ?? "",
  durationMinutes: input.durationMinutes,
  includeUnavailable: normalizeBoolean(input.includeUnavailable, false),
  selectedAddons: normalizeAddonSelections(input.selectedAddons),
});

export const normalizeAvailabilityPlaceSportDayInput = (
  input: AvailabilityPlaceSportDayInput,
) => ({
  placeId: normalizeString(input.placeId) ?? "",
  sportId: normalizeString(input.sportId) ?? "",
  date: normalizeString(input.date) ?? "",
  durationMinutes: input.durationMinutes,
  includeUnavailable: normalizeBoolean(input.includeUnavailable, false),
  includeCourtOptions: normalizeBoolean(input.includeCourtOptions, false),
  selectedAddons: normalizeAddonSelections(input.selectedAddons),
});

export const normalizeAvailabilityPlaceSportRangeInput = (
  input: AvailabilityPlaceSportRangeInput,
) => ({
  placeId: normalizeString(input.placeId) ?? "",
  sportId: normalizeString(input.sportId) ?? "",
  startDate: normalizeString(input.startDate) ?? "",
  endDate: normalizeString(input.endDate) ?? "",
  durationMinutes: input.durationMinutes,
  includeUnavailable: normalizeBoolean(input.includeUnavailable, false),
  includeCourtOptions: normalizeBoolean(input.includeCourtOptions, false),
  selectedAddons: normalizeAddonSelections(input.selectedAddons),
});

export const buildAvailabilityScopeKey = (value: unknown) =>
  serializeStableScope(value);

export const availabilityQueryKeys = {
  courtDay: (input: AvailabilityCourtDayInput) =>
    buildTrpcQueryKey(
      ["availability", "getForCourt"],
      normalizeAvailabilityCourtDayInput(input),
    ),
  courtRange: (input: AvailabilityCourtRangeInput) =>
    buildTrpcQueryKey(
      ["availability", "getForCourtRange"],
      normalizeAvailabilityCourtRangeInput(input),
    ),
  placeSportDay: (input: AvailabilityPlaceSportDayInput) =>
    buildTrpcQueryKey(
      ["availability", "getForPlaceSport"],
      normalizeAvailabilityPlaceSportDayInput(input),
    ),
  placeSportRange: (input: AvailabilityPlaceSportRangeInput) =>
    buildTrpcQueryKey(
      ["availability", "getForPlaceSportRange"],
      normalizeAvailabilityPlaceSportRangeInput(input),
    ),
};
