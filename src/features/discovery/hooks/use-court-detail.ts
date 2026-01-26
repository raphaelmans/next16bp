"use client";

import type { TimeSlot } from "@/shared/components/kudos";
import { toUtcISOString } from "@/shared/lib/time-zone";
import { trpc } from "@/trpc/client";

export interface CourtDetail {
  id: string;
  label: string;
  sport: {
    id: string;
    name: string;
    slug: string;
  };
  tierLabel?: string;
  isActive: boolean;
  placeId: string | null;
}

interface UseCourtDetailOptions {
  courtId: string;
}

export function useCourtDetail({ courtId }: UseCourtDetailOptions) {
  const query = trpc.court.getById.useQuery(
    { courtId },
    { enabled: !!courtId },
  );

  const transformedData: CourtDetail | undefined = query.data
    ? {
        id: query.data.court.id,
        label: query.data.court.label,
        tierLabel: query.data.court.tierLabel ?? undefined,
        isActive: query.data.court.isActive,
        placeId: query.data.court.placeId ?? null,
        sport: {
          id: query.data.sport.id,
          name: query.data.sport.name,
          slug: query.data.sport.slug,
        },
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

const DEFAULT_DURATION_MINUTES = 60;

export function useAvailableSlots({ courtId, date }: UseAvailableSlotsOptions) {
  const dateIso = date ? toUtcISOString(date) : undefined;

  const query = trpc.availability.getForCourt.useQuery(
    {
      courtId,
      date: dateIso ?? "",
      durationMinutes: DEFAULT_DURATION_MINUTES,
    },
    { enabled: !!courtId && !!dateIso },
  );

  const options = query.data?.options ?? [];
  const transformedData: TimeSlot[] = options.map((option) => ({
    id: `${option.courtId}-${option.startTime}-${option.endTime}`,
    startTime: option.startTime,
    endTime: option.endTime,
    status: option.status === "BOOKED" ? "booked" : "available",
    priceCents: option.totalPriceCents,
    currency: option.currency ?? "PHP",
    unavailableReason: option.unavailableReason ?? undefined,
  }));

  return {
    ...query,
    data: transformedData,
    diagnostics: query.data?.diagnostics,
  };
}
