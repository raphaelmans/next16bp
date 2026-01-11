"use client";

import { useQuery } from "@tanstack/react-query";
import type { TimeSlot, TimeSlotStatus } from "@/shared/components/kudos";
import { useTRPC } from "@/trpc/client";

export interface CourtDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  type: "CURATED" | "RESERVABLE";
  description?: string;
  amenities: string[];
  photos: { id: string; url: string; alt?: string }[];
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    viber?: string;
    website?: string;
    phone?: string;
  };
  lat?: number;
  lng?: number;
  isFree?: boolean;
  pricePerHourCents?: number;
  currency?: string;
  coverImageUrl?: string;
  requiresOwnerConfirmation?: boolean;
  paymentHoldMinutes?: number;
  ownerReviewMinutes?: number;
  cancellationCutoffMinutes?: number;
}

interface UseCourtDetailOptions {
  courtId: string;
}

// Type helper for detail casting
interface CuratedDetail {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  viberInfo?: string | null;
  websiteUrl?: string | null;
  otherContactInfo?: string | null;
}

interface ReservableDetail {
  isFree: boolean;
  defaultPriceCents?: number | null;
  defaultCurrency?: string | null;
  requiresOwnerConfirmation?: boolean | null;
  paymentHoldMinutes?: number | null;
  ownerReviewMinutes?: number | null;
  cancellationCutoffMinutes?: number | null;
}

/**
 * Hook to fetch court detail
 * Connected to court.getById tRPC endpoint
 */
export function useCourtDetail({ courtId }: UseCourtDetailOptions) {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.court.getById.queryOptions({ id: courtId }, { enabled: !!courtId }),
  );

  // Transform backend response to CourtDetail
  const transformedData: CourtDetail | undefined = query.data
    ? {
        id: query.data.court.id,
        name: query.data.court.name,
        address: query.data.court.address,
        city: query.data.court.city,
        type: query.data.court.courtType,
        lat: query.data.court.latitude
          ? parseFloat(query.data.court.latitude)
          : undefined,
        lng: query.data.court.longitude
          ? parseFloat(query.data.court.longitude)
          : undefined,
        amenities: query.data.amenities.map((a) => a.name),
        photos: query.data.photos.map((p) => ({
          id: p.id,
          url: p.url,
        })),
        coverImageUrl: query.data.photos[0]?.url,
        organization: query.data.organization
          ? {
              id: query.data.organization.id,
              name: query.data.organization.name,
              slug: query.data.organization.slug,
            }
          : undefined,
        // Handle detail based on court type
        ...(query.data.court.courtType === "CURATED" && query.data.detail
          ? {
              socialLinks: {
                facebook:
                  (query.data.detail as CuratedDetail).facebookUrl ?? undefined,
                instagram:
                  (query.data.detail as CuratedDetail).instagramUrl ??
                  undefined,
                viber:
                  (query.data.detail as CuratedDetail).viberInfo ?? undefined,
                website:
                  (query.data.detail as CuratedDetail).websiteUrl ?? undefined,
                phone:
                  (query.data.detail as CuratedDetail).otherContactInfo ??
                  undefined,
              },
            }
          : {}),
        ...(query.data.court.courtType === "RESERVABLE" && query.data.detail
          ? (() => {
              const detail = query.data.detail as ReservableDetail;
              return {
                isFree: detail.isFree,
                pricePerHourCents: detail.isFree
                  ? undefined
                  : (detail.defaultPriceCents ?? undefined),
                currency: detail.defaultCurrency ?? "PHP",
                requiresOwnerConfirmation:
                  detail.requiresOwnerConfirmation ?? true,
                paymentHoldMinutes: detail.paymentHoldMinutes ?? 15,
                ownerReviewMinutes: detail.ownerReviewMinutes ?? 15,
                cancellationCutoffMinutes:
                  detail.cancellationCutoffMinutes ?? 0,
              };
            })()
          : {}),
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  };
}

interface UseAvailableSlotsOptions {
  courtId: string;
  date?: Date;
}

/**
 * Map backend slot status to frontend status
 */
function mapSlotStatus(backendStatus: string): TimeSlotStatus {
  const statusMap: Record<string, TimeSlotStatus> = {
    AVAILABLE: "available",
    BOOKED: "booked",
    HELD: "held",
    BLOCKED: "booked", // Map BLOCKED to booked for UI purposes (not selectable)
  };
  return statusMap[backendStatus] ?? "booked";
}

/**
 * Hook to fetch available time slots for a court on a specific date
 * Connected to timeSlot.getAvailable tRPC endpoint
 */
export function useAvailableSlots({ courtId, date }: UseAvailableSlotsOptions) {
  const trpc = useTRPC();

  // Get start and end of the selected date
  const startDate = date
    ? new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
      ).toISOString()
    : undefined;
  const endDate = date
    ? new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
      ).toISOString()
    : undefined;

  const query = useQuery(
    trpc.timeSlot.getAvailable.queryOptions(
      {
        courtId,
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      },
      { enabled: !!courtId && !!date },
    ),
  );

  // Transform backend response to TimeSlot[]
  const transformedData: TimeSlot[] = (query.data ?? []).map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: mapSlotStatus(slot.status),
    priceCents: slot.priceCents ?? undefined,
    currency: slot.currency ?? "PHP",
  }));

  return {
    ...query,
    data: transformedData,
  };
}
