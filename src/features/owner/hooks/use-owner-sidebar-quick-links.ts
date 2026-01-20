"use client";

import { useMemo } from "react";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { trpc } from "@/trpc/client";

export interface OwnerSidebarCourt {
  id: string;
  label: string;
}

export interface OwnerSidebarPlace {
  id: string;
  name: string;
  courts: OwnerSidebarCourt[];
}

type OwnerSidebarPlaceRecord = Pick<PlaceRecord, "id" | "name"> & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

type CourtWithSportPayload = {
  court: {
    id: string;
    label: string;
    isActive: boolean;
  };
};

const mapOwnerSidebarPlace = (
  place: OwnerSidebarPlaceRecord,
  courts: CourtWithSportPayload[],
): OwnerSidebarPlace => {
  const activeCourts = courts
    .filter((court) => court.court.isActive)
    .map((court) => ({
      id: court.court.id,
      label: court.court.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    id: place.id,
    name: place.name,
    courts: activeCourts,
  };
};

export function useOwnerSidebarQuickLinks(organizationId?: string | null) {
  const placesQuery = trpc.placeManagement.list.useQuery(
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      select: (data) =>
        data.map((place) => ({
          ...place,
          verification: null,
        })),
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

    return placesQuery.data.map((place, index) =>
      mapOwnerSidebarPlace(place, courtQueries[index]?.data ?? []),
    );
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}
