"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { useTRPCClient } from "@/trpc/client";

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

type TrpcClient = ReturnType<typeof useTRPCClient>;

type OwnerPlace = Pick<PlaceRecord, "id" | "name" | "city">;

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

async function fetchOwnerCourts(
  trpcClient: TrpcClient,
  organizationId: string,
): Promise<OwnerCourt[]> {
  const places = await trpcClient.placeManagement.list.query({
    organizationId,
  });

  const courtGroups = await Promise.all(
    places.map(async (place) => {
      const courts = await trpcClient.courtManagement.listByPlace.query({
        placeId: place.id,
      });
      return courts.map((court) => mapOwnerCourt(court, place));
    }),
  );

  return courtGroups.flat();
}

export function useOwnerCourts(organizationId?: string | null) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["owner-courts", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return fetchOwnerCourts(trpcClient, organizationId);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useOwnerCourt(courtId: string) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["owner-court", courtId],
    queryFn: async () => {
      if (!courtId) return null;
      const court = await trpcClient.courtManagement.getById.query({ courtId });
      const place = await trpcClient.placeManagement.getById.query({
        placeId: court.court.placeId,
      });
      return mapOwnerCourt(court, place.place);
    },
    enabled: !!courtId,
  });
}

export function useDeactivateCourt() {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courtId }: { courtId: string }) =>
      trpcClient.courtManagement.update.mutate({
        courtId,
        isActive: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-courts"] });
    },
  });
}
