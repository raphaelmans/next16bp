"use client";

import { useQuery } from "@tanstack/react-query";
import type { TimeSlot, TimeSlotStatus } from "@/shared/components/kudos";
import { getZonedDayRangeForInstant } from "@/shared/lib/time-zone";
import { useTRPC } from "@/trpc/client";

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
  placeId: string;
}

interface UseCourtDetailOptions {
  courtId: string;
}

export function useCourtDetail({ courtId }: UseCourtDetailOptions) {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.court.getById.queryOptions({ courtId }, { enabled: !!courtId }),
  );

  const transformedData: CourtDetail | undefined = query.data
    ? {
        id: query.data.court.id,
        label: query.data.court.label,
        tierLabel: query.data.court.tierLabel ?? undefined,
        isActive: query.data.court.isActive,
        placeId: query.data.court.placeId,
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
  timeZone?: string;
}

function mapSlotStatus(backendStatus: string): TimeSlotStatus {
  const statusMap: Record<string, TimeSlotStatus> = {
    AVAILABLE: "available",
    BOOKED: "booked",
    HELD: "held",
    BLOCKED: "booked",
  };
  return statusMap[backendStatus] ?? "booked";
}

export function useAvailableSlots({
  courtId,
  date,
  timeZone,
}: UseAvailableSlotsOptions) {
  const trpc = useTRPC();

  const dayRange = date
    ? getZonedDayRangeForInstant(date, timeZone)
    : undefined;
  const startDate = dayRange?.start.toISOString();
  const endDate = dayRange?.end.toISOString();

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
