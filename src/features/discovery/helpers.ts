import { addDays } from "date-fns";
import { getZonedDayKey, getZonedDayRangeFromDayKey } from "@/common/time-zone";
import type { PlaceCardPlace, TimeSlot } from "@/components/kudos";

export interface PlaceSummary extends PlaceCardPlace {
  latitude?: number;
  longitude?: number;
}

interface PlaceListItem {
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    placeType?: "CURATED" | "RESERVABLE";
    featuredRank?: number | null;
  };
  coverImageUrl?: string | null;
  organizationLogoUrl?: string | null;
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string | null;
  verificationStatus?:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | null;
  reservationsEnabled?: boolean | null;
}

export type PlaceVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type PlaceType = "CURATED" | "RESERVABLE";

export interface PlaceVerificationDisplayInput {
  placeType?: PlaceType | null;
  verificationStatus?: PlaceVerificationStatus | null;
  reservationsEnabled?: boolean | null;
}

export interface PlaceVerificationDisplay {
  isBookable: boolean;
  isCurated: boolean;
  isVerified: boolean;
  showBooking: boolean;
  showVerificationBadge: boolean;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
}

export function getPlaceVerificationDisplay(
  input: PlaceVerificationDisplayInput,
): PlaceVerificationDisplay {
  const placeType = input.placeType ?? null;
  const verificationStatus = input.verificationStatus ?? "UNVERIFIED";
  const reservationsEnabled = input.reservationsEnabled ?? false;

  const isBookable = placeType === "RESERVABLE";
  const isCurated = placeType === "CURATED";
  const isVerified = verificationStatus === "VERIFIED";
  const showBooking = isBookable && isVerified && reservationsEnabled;
  const showVerificationBadge = showBooking;
  const showBookingVerificationUi = !showBooking && !isCurated;

  const verificationMessage = showBooking
    ? "Verified for reservations"
    : verificationStatus === "PENDING"
      ? "Verification pending"
      : verificationStatus === "REJECTED"
        ? "Verification needs updates"
        : "Verification required to book";

  return {
    isBookable,
    isCurated,
    isVerified,
    showBooking,
    showVerificationBadge,
    showBookingVerificationUi,
    verificationMessage,
  };
}

export const mapPlaceSummary = (item: PlaceListItem): PlaceSummary => {
  const latitude = Number.parseFloat(item.place.latitude ?? "");
  const longitude = Number.parseFloat(item.place.longitude ?? "");

  return {
    id: item.place.id,
    slug: item.place.slug ?? undefined,
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    coverImageUrl: item.coverImageUrl ?? undefined,
    logoUrl: item.organizationLogoUrl ?? undefined,
    sports: item.sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
    })),
    courtCount: item.courtCount,
    lowestPriceCents: item.lowestPriceCents,
    currency: item.currency ?? undefined,
    placeType: item.place.placeType,
    verificationStatus: item.verificationStatus ?? undefined,
    reservationsEnabled: item.reservationsEnabled ?? undefined,
    featuredRank: item.place.featuredRank ?? 0,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};

export const buildAvailabilityId = (
  courtId: string,
  startTime: string,
  duration: number,
) => `${courtId}-${startTime}-${duration}`;

export const parseDayKeyToDate = (dayKey: string, timeZone?: string) =>
  getZonedDayRangeFromDayKey(dayKey, timeZone).start;

export const getWeekStartDayKey = (
  dayKey: string,
  timeZone: string,
  weekStartsOn = 0,
) => {
  const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  const dayOfWeek = dayStart.getDay();
  const delta = (dayOfWeek - weekStartsOn + 7) % 7;
  const weekStart = addDays(dayStart, -delta);
  return getZonedDayKey(weekStart, timeZone);
};

export const getWeekDayKeys = (weekStartDayKey: string, timeZone: string) => {
  const start = getZonedDayRangeFromDayKey(weekStartDayKey, timeZone).start;
  return Array.from({ length: 7 }, (_, i) =>
    getZonedDayKey(addDays(start, i), timeZone),
  );
};

export type AvailabilityErrorInfo = {
  isBookingWindowError: boolean;
  isError: boolean;
  refetch: () => void;
};

export const getAvailabilityErrorInfo = (
  error: unknown,
  refetch: () => void,
): AvailabilityErrorInfo => {
  if (!error) {
    return { isBookingWindowError: false, isError: false, refetch };
  }

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  if (isRecord(error)) {
    const data = isRecord(error.data) ? error.data : null;
    if (data?.code === "BOOKING_WINDOW_EXCEEDED") {
      return { isBookingWindowError: true, isError: true, refetch };
    }

    const message = error.message;
    if (
      typeof message === "string" &&
      message.includes("beyond the maximum booking window")
    ) {
      return { isBookingWindowError: true, isError: true, refetch };
    }
  }

  return { isBookingWindowError: false, isError: true, refetch };
};

export type AvailabilitySlotOption = {
  courtId: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency?: string | null;
  status?: string | null;
  unavailableReason?: string | null;
};

export const mapAvailabilityOptionsToSlots = (
  options: AvailabilitySlotOption[],
  durationMinutes: number,
): TimeSlot[] =>
  options.map((option) => ({
    id: buildAvailabilityId(option.courtId, option.startTime, durationMinutes),
    startTime: option.startTime,
    endTime: option.endTime,
    priceCents: option.totalPriceCents,
    currency: option.currency ?? "PHP",
    status: option.status === "BOOKED" ? "booked" : "available",
    unavailableReason:
      (option.unavailableReason as TimeSlot["unavailableReason"]) ?? undefined,
  }));

export const groupSlotsByDayKey = (slots: TimeSlot[], timeZone: string) => {
  const byDay = new Map<string, TimeSlot[]>();
  for (const slot of slots) {
    const dayKey = getZonedDayKey(slot.startTime, timeZone);
    const existing = byDay.get(dayKey);
    if (existing) {
      existing.push(slot);
    } else {
      byDay.set(dayKey, [slot]);
    }
  }
  for (const [, daySlots] of byDay) {
    daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return byDay;
};

export const buildSlotsByDayKey = (
  options: AvailabilitySlotOption[],
  timeZone: string,
  durationMinutes: number,
) =>
  groupSlotsByDayKey(
    mapAvailabilityOptionsToSlots(options, durationMinutes),
    timeZone,
  );
