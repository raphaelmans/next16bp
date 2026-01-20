"use client";

import { useMemo } from "react";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { trpc } from "@/trpc/client";
import type { OwnerCourt } from "./use-owner-courts";

export interface OwnerPlaceSport {
  id: string;
  name: string;
}

export interface OwnerPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  timeZone: string;
  coverImageUrl?: string;
  courtCount: number;
  sports: OwnerPlaceSport[];
  isActive: boolean;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
}

type OwnerPlaceRecord = Pick<
  PlaceRecord,
  "id" | "name" | "address" | "city" | "timeZone" | "isActive"
> & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

type CourtWithSportPayload = {
  court: {
    id: string;
    label: string;
    placeId: string;
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

const mapSports = (courts: CourtWithSportPayload[]): OwnerPlaceSport[] => {
  const map = new Map<string, OwnerPlaceSport>();
  courts.forEach((court) => {
    map.set(court.sport.id, { id: court.sport.id, name: court.sport.name });
  });
  return Array.from(map.values());
};

const mapOwnerPlace = (
  place: OwnerPlaceRecord,
  courts: CourtWithSportPayload[],
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null,
): OwnerPlace => ({
  id: place.id,
  name: place.name,
  address: place.address,
  city: place.city,
  timeZone: place.timeZone,
  coverImageUrl: undefined,
  courtCount: courts.length,
  sports: mapSports(courts),
  isActive: place.isActive,
  verificationStatus: verification?.status ?? undefined,
  reservationsEnabled: verification?.reservationsEnabled ?? undefined,
});

const mapOwnerCourt = (
  court: CourtWithSportPayload,
  place: OwnerPlaceRecord,
): OwnerCourt => ({
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
});

export function useOwnerPlaces(organizationId?: string | null) {
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
      mapOwnerPlace(place, courtQueries[index]?.data ?? [], place.verification),
    );
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useOwnerPlace(placeId: string) {
  const placeQuery = trpc.placeManagement.getById.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = trpc.courtManagement.listByPlace.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!placeQuery.data) return undefined;
    return mapOwnerPlace(
      { ...placeQuery.data.place, verification: placeQuery.data.verification },
      courtsQuery.data ?? [],
      placeQuery.data.verification,
    );
  }, [courtsQuery.data, placeQuery.data]);

  return {
    ...placeQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}

export function useOwnerCourtsByPlace(placeId: string) {
  const placeQuery = trpc.placeManagement.getById.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = trpc.courtManagement.listByPlace.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!placeQuery.data) return [] as OwnerCourt[];
    return (courtsQuery.data ?? []).map((court) =>
      mapOwnerCourt(court, placeQuery.data.place),
    );
  }, [courtsQuery.data, placeQuery.data]);

  return {
    ...courtsQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}
