"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/trpc/client";

export interface PlaceSport {
  id: string;
  name: string;
  slug?: string;
}

export interface PlaceCourt {
  id: string;
  label: string;
  sportId: string;
  sportName: string;
  tierLabel?: string;
  isActive: boolean;
}

export interface PlacePhoto {
  id: string;
  url: string;
  alt?: string;
}

export interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string;
  timeZone: string;
  coverImageUrl?: string;
  sports: PlaceSport[];
  courts: PlaceCourt[];
  photos: PlacePhoto[];
}

export interface AvailabilityOption {
  id: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
}

interface UsePlaceDetailOptions {
  placeId: string;
}

const mapCourtsToSports = (courts: PlaceCourt[]) => {
  const map = new Map<string, PlaceSport>();
  courts.forEach((court) => {
    map.set(court.sportId, { id: court.sportId, name: court.sportName });
  });
  return Array.from(map.values());
};

export function usePlaceDetail({ placeId }: UsePlaceDetailOptions) {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ["place", placeId],
    queryFn: async () => {
      if (!placeId) return undefined;
      const response = await trpcClient.place.getById.query({ placeId });
      const courts: PlaceCourt[] = response.courts.map((court) => ({
        id: court.court.id,
        label: court.court.label,
        sportId: court.sport.id,
        sportName: court.sport.name,
        tierLabel: court.court.tierLabel ?? undefined,
        isActive: court.court.isActive,
      }));
      const photos = response.photos.map((photo, index) => ({
        id: photo.id,
        url: photo.url,
        alt: `${response.place.name} photo ${index + 1}`,
      }));

      return {
        id: response.place.id,
        name: response.place.name,
        address: response.place.address,
        city: response.place.city,
        timeZone: response.place.timeZone,
        description: undefined,
        coverImageUrl: photos[0]?.url,
        courts,
        photos,
        sports: mapCourtsToSports(courts),
      } satisfies PlaceDetail;
    },
    enabled: !!placeId,
  });
}

interface UsePlaceAvailabilityOptions {
  place?: PlaceDetail;
  sportId?: string;
  courtId?: string;
  date?: Date;
  durationMinutes: number;
  mode: "any" | "court";
}

const getDateIso = (date?: Date) => {
  if (!date) return "";
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).toISOString();
};

export function usePlaceAvailability({
  place,
  sportId,
  courtId,
  date,
  durationMinutes,
  mode,
}: UsePlaceAvailabilityOptions) {
  const trpcClient = useTRPCClient();
  const dateIso = getDateIso(date);
  const safeDuration = Number.isFinite(durationMinutes) ? durationMinutes : 0;

  const courtQuery = useQuery({
    queryKey: [
      "place-availability",
      place?.id,
      courtId,
      dateIso,
      safeDuration,
      "court",
    ],
    queryFn: async () =>
      trpcClient.availability.getForCourt.query({
        courtId: courtId ?? "",
        date: dateIso,
        durationMinutes: safeDuration,
      }),
    enabled:
      !!courtId &&
      !!date &&
      safeDuration > 0 &&
      mode === "court" &&
      !!place?.id,
  });

  const placeQuery = useQuery({
    queryKey: [
      "place-availability",
      place?.id,
      sportId,
      dateIso,
      safeDuration,
      "any",
    ],
    queryFn: async () =>
      trpcClient.availability.getForPlaceSport.query({
        placeId: place?.id ?? "",
        sportId: sportId ?? "",
        date: dateIso,
        durationMinutes: safeDuration,
      }),
    enabled:
      !!place?.id && !!sportId && !!date && safeDuration > 0 && mode === "any",
  });

  const activeQuery = mode === "court" ? courtQuery : placeQuery;
  const data = (activeQuery.data ?? []).map((option) => ({
    id: `${option.courtId}-${option.startTime}-${safeDuration}`,
    startTime: option.startTime,
    endTime: option.endTime,
    totalPriceCents: option.totalPriceCents,
    currency: option.currency ?? "PHP",
    courtId: option.courtId,
    courtLabel: option.courtLabel,
  }));

  return {
    ...activeQuery,
    data,
  };
}
