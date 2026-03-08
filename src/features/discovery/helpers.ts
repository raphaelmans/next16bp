import { addDays } from "date-fns";
import { toAppError } from "@/common/errors/to-app-error";
import { getReservationEnablement } from "@/common/reservation-enablement";
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
  hasPaymentMethods?: boolean | null;
}

export type PlaceVerificationStatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "muted";

export interface PlaceVerificationDisplay {
  isBookable: boolean;
  isCurated: boolean;
  isVerified: boolean;
  showBooking: boolean;
  showVerificationBadge: boolean;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: PlaceVerificationStatusVariant;
}

export interface PublicVenueSortInput {
  id: string;
  name: string;
  featuredRank?: number | null;
  provinceRank?: number | null;
  placeType?: PlaceType | null;
  verificationStatus?: PlaceVerificationStatus | null;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export const getPublicVenueSortBucket = (item: PublicVenueSortInput) => {
  const isVerifiedReservable =
    item.placeType === "RESERVABLE" && item.verificationStatus === "VERIFIED";
  const hasReviews = (item.reviewCount ?? 0) > 0;

  if ((item.featuredRank ?? 0) > 0) return 0;
  if ((item.provinceRank ?? 0) > 0) return 1;
  if (isVerifiedReservable && hasReviews) return 2;
  if (isVerifiedReservable) return 3;
  if (hasReviews) return 4;
  return 5;
};

export const comparePublicVenueSort = (
  left: PublicVenueSortInput,
  right: PublicVenueSortInput,
) =>
  getPublicVenueSortBucket(left) - getPublicVenueSortBucket(right) ||
  (left.featuredRank ?? 0) - (right.featuredRank ?? 0) ||
  (left.provinceRank ?? 0) - (right.provinceRank ?? 0) ||
  (right.reviewCount ?? 0) - (left.reviewCount ?? 0) ||
  (right.averageRating ?? 0) - (left.averageRating ?? 0) ||
  left.name.localeCompare(right.name) ||
  left.id.localeCompare(right.id);

export const hasVenueSlug = <T extends { slug?: string | null }>(
  item: T,
): item is T & { slug: string } =>
  typeof item.slug === "string" && item.slug.length > 0;

export function getPlaceVerificationDisplay(
  input: PlaceVerificationDisplayInput,
): PlaceVerificationDisplay {
  const placeType = input.placeType ?? null;
  const verificationStatus = input.verificationStatus ?? "UNVERIFIED";
  const reservationsEnabled = input.reservationsEnabled ?? false;
  const hasPaymentMethods = input.hasPaymentMethods ?? null;

  const enablement = getReservationEnablement({
    placeType,
    verificationStatus,
    reservationsEnabled,
    hasPaymentMethods,
  });
  const hasIssue = (code: (typeof enablement.issues)[number]["code"]) =>
    enablement.issues.some((issue) => issue.code === code);

  const isBookable = placeType === "RESERVABLE";
  const isCurated = placeType === "CURATED";
  const isVerified = verificationStatus === "VERIFIED";
  const showBooking = enablement.canShowPublicBooking;
  const showVerificationBadge = isVerified;
  const showBookingVerificationUi = !isCurated && (!showBooking || !isVerified);

  const hasVerificationRequiredIssue = hasIssue("VERIFICATION_REQUIRED");
  const hasVerificationPendingIssue = hasIssue("VERIFICATION_PENDING");
  const hasVerificationRejectedIssue = hasIssue("VERIFICATION_REJECTED");
  const hasReservationsDisabledIssue = hasIssue("RESERVATIONS_DISABLED");
  const hasNoPaymentMethodIssue = hasIssue("NO_PAYMENT_METHOD");

  const verificationMessage = showBooking
    ? isVerified
      ? "Verified for reservations"
      : hasVerificationPendingIssue
        ? "Booking available while verification is pending"
        : hasVerificationRejectedIssue
          ? "Booking available while verification needs updates"
          : "Booking available before verification"
    : hasVerificationPendingIssue
      ? "Verification pending"
      : hasVerificationRejectedIssue
        ? "Verification needs updates"
        : hasVerificationRequiredIssue
          ? "Verification required to book"
          : hasReservationsDisabledIssue
            ? "Reservations not yet enabled"
            : hasNoPaymentMethodIssue
              ? "Payment method required"
              : "Booking not available yet";

  const verificationDescription = showBooking
    ? isVerified
      ? ""
      : hasVerificationPendingIssue
        ? "You can still book this venue while the verification review is in progress."
        : hasVerificationRejectedIssue
          ? "You can still book this venue, but the owner still needs to update verification documents."
          : "You can still book this venue even though verification has not been completed yet."
    : hasVerificationPendingIssue
      ? "Verification is still under review. If booking is enabled, players will see a warning until review is complete."
      : hasVerificationRejectedIssue
        ? "Verification needs updates. If booking is enabled, players will see a warning until the owner resubmits."
        : hasVerificationRequiredIssue
          ? "This venue is not verified yet. If booking is enabled, players will see a warning until verification is submitted."
          : hasReservationsDisabledIssue
            ? "The owner has not yet enabled online reservations for this venue."
            : hasNoPaymentMethodIssue
              ? "The owner needs to add at least one payment method before online bookings can go live."
              : "Online booking is not available for this venue yet.";

  const verificationStatusVariant: PlaceVerificationStatusVariant = showBooking
    ? isVerified
      ? "success"
      : hasVerificationRejectedIssue
        ? "destructive"
        : "warning"
    : hasVerificationRejectedIssue
      ? "destructive"
      : hasVerificationPendingIssue ||
          hasReservationsDisabledIssue ||
          hasNoPaymentMethodIssue
        ? "warning"
        : "muted";

  return {
    isBookable,
    isCurated,
    isVerified,
    showBooking,
    showVerificationBadge,
    showBookingVerificationUi,
    verificationMessage,
    verificationDescription,
    verificationStatusVariant,
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

  const appError = toAppError(error);
  const code =
    appError.kind === "validation" ||
    appError.kind === "unauthorized" ||
    appError.kind === "forbidden" ||
    appError.kind === "not_found" ||
    appError.kind === "rate_limited"
      ? appError.code
      : undefined;
  if (code === "BOOKING_WINDOW_EXCEEDED") {
    return { isBookingWindowError: true, isError: true, refetch };
  }

  if (appError.message.includes("beyond the maximum booking window")) {
    return { isBookingWindowError: true, isError: true, refetch };
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

export const filterSlotsByDayKey = (
  slots: TimeSlot[],
  dayKey: string,
  timeZone: string,
): TimeSlot[] => {
  const filtered = slots.filter(
    (slot) => getZonedDayKey(slot.startTime, timeZone) === dayKey,
  );
  filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return filtered;
};

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
