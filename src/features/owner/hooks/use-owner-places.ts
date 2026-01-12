"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { useTRPCClient } from "@/trpc/client";
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
}

type TrpcClient = ReturnType<typeof useTRPCClient>;

type OwnerPlaceRecord = Pick<
  PlaceRecord,
  "id" | "name" | "address" | "city" | "timeZone" | "isActive"
>;

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

async function fetchCourtsByPlace(trpcClient: TrpcClient, placeId: string) {
  return trpcClient.courtManagement.listByPlace.query({ placeId });
}

export function useOwnerPlaces(organizationId?: string | null) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["owner-places", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const places = await trpcClient.placeManagement.list.query({
        organizationId,
      });
      const courtsByPlace = await Promise.all(
        places.map((place) => fetchCourtsByPlace(trpcClient, place.id)),
      );
      return places.map((place, index) =>
        mapOwnerPlace(place, courtsByPlace[index] ?? []),
      );
    },
    enabled: !!organizationId,
  });
}

export function useOwnerPlace(placeId: string) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["owner-place", placeId],
    queryFn: async () => {
      if (!placeId) return undefined;
      const placeResponse = await trpcClient.placeManagement.getById.query({
        placeId,
      });
      const courts = await fetchCourtsByPlace(trpcClient, placeId);
      return mapOwnerPlace(placeResponse.place, courts);
    },
    enabled: !!placeId,
  });
}

export function useOwnerCourtsByPlace(placeId: string) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["owner-place-courts", placeId],
    queryFn: async () => {
      if (!placeId) return [] as OwnerCourt[];
      const [placeResponse, courts] = await Promise.all([
        trpcClient.placeManagement.getById.query({ placeId }),
        fetchCourtsByPlace(trpcClient, placeId),
      ]);
      return courts.map((court) => mapOwnerCourt(court, placeResponse.place));
    },
    enabled: !!placeId,
  });
}
