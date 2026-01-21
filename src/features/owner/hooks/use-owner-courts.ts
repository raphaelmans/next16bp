"use client";

import { useMemo } from "react";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { trpc } from "@/trpc/client";

export interface OwnerCourt {
  id: string;
  label: string;
  placeId: string;
  placeName: string;
  city: string;
  sportId: string;
  sportName: string;
  tierLabel?: string | null;
  coverImageUrl?: string;
  status: "active" | "inactive";
  openSlots: number;
  totalSlots: number;
  createdAt: Date | string;
  isActive: boolean;
}

type OwnerPlace = Pick<PlaceRecord, "id" | "name" | "city">;

type CourtWithSportPayload = {
  court: {
    id: string;
    label: string;
    placeId: string | null;
    sportId: string;
    tierLabel: string | null;
    isActive: boolean;
    createdAt: string | Date;
  };
  sport: {
    id: string;
    name: string;
  };
};

function mapOwnerCourt(
  court: CourtWithSportPayload,
  place: OwnerPlace,
): OwnerCourt {
  return {
    id: court.court.id,
    label: court.court.label,
    placeId: place.id,
    placeName: place.name,
    city: place.city,
    sportId: court.sport.id,
    sportName: court.sport.name,
    tierLabel: court.court.tierLabel,
    coverImageUrl: undefined,
    status: court.court.isActive ? "active" : "inactive",
    openSlots: 0,
    totalSlots: 0,
    createdAt: court.court.createdAt,
    isActive: court.court.isActive,
  };
}

export function useOwnerCourts(organizationId?: string | null) {
  const placesQuery = trpc.placeManagement.list.useQuery(
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      staleTime: 1000 * 60 * 5,
    },
  );

  const courtQueries = trpc.useQueries((t) =>
    (placesQuery.data ?? []).map((place) =>
      t.courtManagement.listByPlace({ placeId: place.id }),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);

  const data = useMemo(() => {
    if (!placesQuery.data) return [];

    return courtQueries.flatMap((query, index) => {
      const place = placesQuery.data[index];
      if (!place) return [];

      return (query.data ?? []).map((court) => mapOwnerCourt(court, place));
    });
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useOwnerCourt(courtId: string) {
  const courtQuery = trpc.courtManagement.getById.useQuery(
    { courtId },
    { enabled: !!courtId },
  );

  const placeId = courtQuery.data?.court.placeId ?? "";

  const placeQuery = trpc.placeManagement.getById.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!courtQuery.data || !placeQuery.data) return null;
    return mapOwnerCourt(courtQuery.data, placeQuery.data.place);
  }, [courtQuery.data, placeQuery.data]);

  return {
    ...courtQuery,
    data,
    isLoading: courtQuery.isLoading || placeQuery.isLoading,
  };
}

export function useDeactivateCourt() {
  const utils = trpc.useUtils();

  return trpc.courtManagement.update.useMutation({
    onSuccess: async () => {
      await utils.courtManagement.invalidate();
    },
  });
}
