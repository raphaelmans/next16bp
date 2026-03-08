"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFeatureQueryOptions,
  useFeatureQueries,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import type { PricingBreakdown } from "@/common/pricing-breakdown";
import {
  normalizeAvailabilityCourtDayInput,
  normalizeAvailabilityPlaceSportDayInput,
} from "@/common/query-keys";
import { getZonedStartOfDayIso, toUtcISOString } from "@/common/time-zone";
import type { PlaceCardPlace, TimeSlot } from "@/components/kudos";
import {
  createDiscoveryPlaceCardMediaQueryOptions,
  createDiscoveryPlaceCardMetaQueryOptions,
  DISCOVERY_TIER2_STALE_TIME_MS,
} from "@/features/discovery/query-options";
import { getDiscoveryApi } from "../api.runtime";
import { useModDiscoveryAvailabilityRealtimeSync } from "../realtime";

const discoveryApi = getDiscoveryApi();

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

export function useModCourtDetail({ courtId }: UseCourtDetailOptions) {
  const query = useFeatureQuery(
    ["court", "getById"],
    discoveryApi.queryCourtGetById,
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

export function useModAvailableSlots({
  courtId,
  date,
}: UseAvailableSlotsOptions) {
  const dateIso = date ? toUtcISOString(date) : undefined;

  const query = useFeatureQuery(
    ["availability", "getForCourt"],
    discoveryApi.queryAvailabilityGetForCourt,
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

export interface DiscoveryPlaceSummary {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  placeType?: "CURATED" | "RESERVABLE";
  featuredRank?: number;
  provinceRank?: number;
  latitude?: number;
  longitude?: number;
}

export interface PlaceCardMedia {
  coverImageUrl?: string;
  organizationLogoUrl?: string;
}

export interface PlaceCardMeta {
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
  hasPaymentMethods?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export const buildDiscoveryPlaceCard = (
  summary: DiscoveryPlaceSummary,
  media?: PlaceCardMedia,
  meta?: PlaceCardMeta,
): PlaceCardPlace => ({
  id: summary.id,
  slug: summary.slug ?? undefined,
  name: summary.name,
  address: summary.address,
  city: summary.city,
  coverImageUrl: media?.coverImageUrl,
  logoUrl: media?.organizationLogoUrl,
  sports: meta?.sports ?? [],
  courtCount: meta?.courtCount,
  lowestPriceCents: meta?.lowestPriceCents,
  currency: meta?.currency,
  placeType: summary.placeType,
  verificationStatus: meta?.verificationStatus,
  reservationsEnabled: meta?.reservationsEnabled,
  featuredRank: summary.featuredRank,
  provinceRank: summary.provinceRank,
  averageRating: meta?.averageRating,
  reviewCount: meta?.reviewCount,
});

export function useModDiscoveryPlaceCardDetails(
  placeIds: string[],
  sportId?: string,
) {
  const queries = useFeatureQueries([
    createFeatureQueryOptions(
      ["place", "cardMediaByIds"],
      discoveryApi.queryPlaceCardMediaByIds,
      { placeIds },
      { enabled: placeIds.length > 0 },
    ),
    createFeatureQueryOptions(
      ["place", "cardMetaByIds"],
      discoveryApi.queryPlaceCardMetaByIds,
      { placeIds, sportId },
      { enabled: placeIds.length > 0 },
    ),
  ]);

  const mediaQuery = queries[0];
  const metaQuery = queries[1];

  const mediaById = useMemo(() => {
    const record: Record<string, PlaceCardMedia> = {};
    for (const item of mediaQuery?.data ?? []) {
      record[item.placeId] = {
        coverImageUrl: item.coverImageUrl ?? undefined,
        organizationLogoUrl: item.organizationLogoUrl ?? undefined,
      };
    }
    return record;
  }, [mediaQuery?.data]);

  const metaById = useMemo(() => {
    const record: Record<string, PlaceCardMeta> = {};
    for (const item of metaQuery?.data ?? []) {
      record[item.placeId] = {
        sports: item.sports ?? [],
        courtCount: item.courtCount,
        lowestPriceCents: item.lowestPriceCents ?? undefined,
        currency: item.currency ?? undefined,
        verificationStatus: item.verificationStatus ?? undefined,
        reservationsEnabled: item.reservationsEnabled ?? undefined,
        hasPaymentMethods: item.hasPaymentMethods ?? undefined,
      };
    }
    return record;
  }, [metaQuery?.data]);

  return {
    mediaById,
    metaById,
    isMediaLoading: mediaQuery?.isLoading ?? false,
    isMetaLoading: metaQuery?.isLoading ?? false,
  };
}

export function useModDiscoveryProgressivePlaceCardDetails(
  placeIds: string[],
  sportId: string | undefined,
) {
  const queries = useFeatureQueries([
    createDiscoveryPlaceCardMediaQueryOptions(
      discoveryApi.queryPlaceCardMediaByIds,
      { placeIds },
      {
        enabled: placeIds.length > 0,
        staleTime: DISCOVERY_TIER2_STALE_TIME_MS,
      },
    ),
    createDiscoveryPlaceCardMetaQueryOptions(
      discoveryApi.queryPlaceCardMetaByIds,
      { placeIds, sportId },
      {
        enabled: placeIds.length > 0,
        staleTime: DISCOVERY_TIER2_STALE_TIME_MS,
      },
    ),
  ] as const);

  const mediaQuery = queries[0];
  const metaQuery = queries[1];

  const mediaById = useMemo(() => {
    const record: Record<string, PlaceCardMedia> = {};
    for (const item of mediaQuery?.data ?? []) {
      record[item.placeId] = {
        coverImageUrl: item.coverImageUrl ?? undefined,
        organizationLogoUrl: item.organizationLogoUrl ?? undefined,
      };
    }
    return record;
  }, [mediaQuery?.data]);

  const metaById = useMemo(() => {
    const record: Record<string, PlaceCardMeta> = {};
    for (const item of metaQuery?.data ?? []) {
      record[item.placeId] = {
        sports: item.sports ?? [],
        courtCount: item.courtCount,
        lowestPriceCents: item.lowestPriceCents ?? undefined,
        currency: item.currency ?? undefined,
        verificationStatus: item.verificationStatus ?? undefined,
        reservationsEnabled: item.reservationsEnabled ?? undefined,
        hasPaymentMethods: item.hasPaymentMethods ?? undefined,
      };
    }
    return record;
  }, [metaQuery?.data]);

  const mediaLoadingIds = useMemo(() => {
    if (!(mediaQuery?.isLoading ?? false)) {
      return new Set<string>();
    }
    return new Set(placeIds);
  }, [mediaQuery?.isLoading, placeIds]);

  const metaLoadingIds = useMemo(() => {
    if (!(metaQuery?.isLoading ?? false)) {
      return new Set<string>();
    }
    return new Set(placeIds);
  }, [metaQuery?.isLoading, placeIds]);

  return {
    mediaById,
    metaById,
    mediaLoadingIds,
    metaLoadingIds,
  };
}

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

export type PlaceType = "CURATED" | "RESERVABLE";
export type PlaceClaimStatus =
  | "UNCLAIMED"
  | "CLAIM_PENDING"
  | "CLAIMED"
  | "REMOVAL_REQUESTED";

export interface PlaceContactDetail {
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  phoneNumber?: string;
  viberInfo?: string;
  otherContactInfo?: string;
}

export interface PlaceDetail {
  id: string;
  slug?: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  extGPlaceId?: string;
  description?: string;
  timeZone: string;
  coverImageUrl?: string;
  logoUrl?: string;
  sports: PlaceSport[];
  courts: PlaceCourt[];
  photos: PlacePhoto[];
  placeType: PlaceType;
  claimStatus: PlaceClaimStatus;
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    reservationsEnabled: boolean;
  } | null;
  hasPaymentMethods?: boolean;
  contactDetail?: PlaceContactDetail;
  amenities: string[];
}

export interface AvailabilityOption {
  id: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
  status?: "AVAILABLE" | "BOOKED";
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN";
  pricingWarnings?: string[];
  pricingBreakdown?: PricingBreakdown;
  courtOptions?: AvailabilityCourtOption[];
}

export interface AvailabilityCourtOption {
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  totalPriceCents: number;
  currency: string | null;
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  pricingWarnings?: string[];
  pricingBreakdown?: PricingBreakdown;
}

export interface AvailabilityDiagnostics {
  hasHoursWindows: boolean;
  hasRateRules: boolean;
  dayHasHours: boolean;
  allSlotsBooked: boolean;
  reservationsDisabled?: boolean;
}

interface UsePlaceDetailOptions {
  placeIdOrSlug: string;
}

const mapCourtsToSports = (courts: PlaceCourt[]) => {
  const map = new Map<string, PlaceSport>();
  courts.forEach((court) => {
    map.set(court.sportId, { id: court.sportId, name: court.sportName });
  });
  return Array.from(map.values());
};

export function useModPlaceDetail({ placeIdOrSlug }: UsePlaceDetailOptions) {
  return useFeatureQuery(
    ["place", "getByIdOrSlug"],
    discoveryApi.queryPlaceGetByIdOrSlug,
    { placeIdOrSlug },
    {
      enabled: !!placeIdOrSlug,
      select: (response) => {
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

        const latitudeRaw = response.place.latitude;
        const longitudeRaw = response.place.longitude;
        const latitude =
          latitudeRaw === null || latitudeRaw === undefined
            ? undefined
            : Number.parseFloat(latitudeRaw.toString());
        const longitude =
          longitudeRaw === null || longitudeRaw === undefined
            ? undefined
            : Number.parseFloat(longitudeRaw.toString());

        const contactDetail = response.contactDetail
          ? {
              websiteUrl: response.contactDetail.websiteUrl ?? undefined,
              facebookUrl: response.contactDetail.facebookUrl ?? undefined,
              instagramUrl: response.contactDetail.instagramUrl ?? undefined,
              phoneNumber: response.contactDetail.phoneNumber ?? undefined,
              viberInfo: response.contactDetail.viberInfo ?? undefined,
              otherContactInfo:
                response.contactDetail.otherContactInfo ?? undefined,
            }
          : undefined;

        return {
          id: response.place.id,
          slug: response.place.slug ?? undefined,
          name: response.place.name,
          address: response.place.address,
          city: response.place.city,
          latitude: Number.isFinite(latitude) ? latitude : undefined,
          longitude: Number.isFinite(longitude) ? longitude : undefined,
          extGPlaceId: response.place.extGPlaceId ?? undefined,
          timeZone: response.place.timeZone,
          description: undefined,
          coverImageUrl: photos[0]?.url,
          logoUrl: response.organizationLogoUrl ?? undefined,
          courts,
          photos,
          sports: mapCourtsToSports(courts),
          placeType: response.place.placeType,
          claimStatus: response.place.claimStatus,
          verification: response.verification
            ? {
                status: response.verification.status as
                  | "UNVERIFIED"
                  | "PENDING"
                  | "VERIFIED"
                  | "REJECTED",
                reservationsEnabled: response.verification.reservationsEnabled,
              }
            : null,
          hasPaymentMethods: response.hasPaymentMethods ?? undefined,
          contactDetail,
          amenities: response.amenities
            .map((a) => a.name)
            .filter((name): name is string => Boolean(name)),
        } satisfies PlaceDetail;
      },
    },
  );
}

type UsePlaceAvailabilitySelectionOptions = {
  place?: PlaceDetail;
  isBookable: boolean;
  defaultDurationMinutes?: number;
};

export function useModPlaceAvailabilitySelection({
  place,
  isBookable,
  defaultDurationMinutes = 60,
}: UsePlaceAvailabilitySelectionOptions) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [durationMinutes, setDurationMinutes] = useState(
    defaultDurationMinutes,
  );
  const [selectedSportId, setSelectedSportId] = useState<string>();
  const [selectionMode, setSelectionMode] = useState<"any" | "court">("court");
  const [selectedCourtId, setSelectedCourtId] = useState<string>();
  const [selectedStartTime, setSelectedStartTime] = useState<string>();
  const [selectedSlotId, setSelectedSlotId] = useState<string>();
  const [courtViewMode, setCourtViewMode] = useState<"week" | "day">("week");
  const [anyViewMode, setAnyViewMode] = useState<"week" | "day">("week");

  const clearSelection = useCallback(
    (resetDuration = false) => {
      setSelectedStartTime(undefined);
      setSelectedSlotId(undefined);
      if (resetDuration) {
        setDurationMinutes(defaultDurationMinutes);
      }
    },
    [defaultDurationMinutes],
  );

  const courtsForSport = useMemo(() => {
    if (!place || !selectedSportId) return [];
    return place.courts
      .filter((court) => court.sportId === selectedSportId)
      .filter((court) => court.isActive);
  }, [place, selectedSportId]);

  useEffect(() => {
    if (!place || !isBookable) return;
    if (!selectedSportId) {
      setSelectedSportId(place.sports[0]?.id);
    }
  }, [isBookable, place, selectedSportId]);

  useEffect(() => {
    if (!isBookable) return;
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    if (courtsForSport[0]?.id) {
      setSelectedCourtId(courtsForSport[0].id);
    }
  }, [courtsForSport, isBookable, selectedCourtId, selectionMode]);

  return {
    selectedDate,
    setSelectedDate,
    durationMinutes,
    setDurationMinutes,
    selectedSportId,
    setSelectedSportId,
    selectionMode,
    setSelectionMode,
    selectedCourtId,
    setSelectedCourtId,
    selectedStartTime,
    setSelectedStartTime,
    selectedSlotId,
    setSelectedSlotId,
    courtViewMode,
    setCourtViewMode,
    anyViewMode,
    setAnyViewMode,
    courtsForSport,
    clearSelection,
  };
}

interface UsePlaceAvailabilityOptions {
  place?: PlaceDetail;
  sportId?: string;
  courtId?: string;
  selectedAddons?: { addonId: string; quantity: number }[];
  date?: Date;
  durationMinutes: number;
  mode: "any" | "court";
  includeUnavailable?: boolean;
  includeCourtOptions?: boolean;
}

const getDateIso = (date?: Date, timeZone?: string) => {
  if (!date) return "";
  return getZonedStartOfDayIso(date, timeZone);
};

const emptyDiagnostics: AvailabilityDiagnostics = {
  hasHoursWindows: false,
  hasRateRules: false,
  dayHasHours: false,
  allSlotsBooked: false,
  reservationsDisabled: false,
};

export function useModPlaceAvailability({
  place,
  sportId,
  courtId,
  selectedAddons,
  date,
  durationMinutes,
  mode,
  includeUnavailable,
  includeCourtOptions,
}: UsePlaceAvailabilityOptions) {
  const dateIso = getDateIso(date, place?.timeZone);
  const safeDuration = Number.isFinite(durationMinutes) ? durationMinutes : 0;

  const courtQuery = useFeatureQuery(
    ["availability", "getForCourt"],
    discoveryApi.queryAvailabilityGetForCourt,
    normalizeAvailabilityCourtDayInput({
      courtId: courtId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
      selectedAddons,
    }),
    {
      enabled:
        !!courtId &&
        !!date &&
        safeDuration > 0 &&
        mode === "court" &&
        !!place?.id,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      placeholderData: (prev) => prev,
    },
  );
  useModDiscoveryAvailabilityRealtimeSync({
    enabled:
      !!courtId &&
      !!date &&
      safeDuration > 0 &&
      mode === "court" &&
      !!place?.id,
    courtDayInput: {
      courtId: courtId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
      selectedAddons,
    },
  });

  const placeQuery = useFeatureQuery(
    ["availability", "getForPlaceSport"],
    discoveryApi.queryAvailabilityGetForPlaceSport,
    normalizeAvailabilityPlaceSportDayInput({
      placeId: place?.id ?? "",
      sportId: sportId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
      includeCourtOptions,
      selectedAddons,
    }),
    {
      enabled:
        !!place?.id &&
        !!sportId &&
        !!date &&
        safeDuration > 0 &&
        mode === "any",
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      placeholderData: (prev) => prev,
    },
  );
  useModDiscoveryAvailabilityRealtimeSync({
    enabled:
      !!place?.id && !!sportId && !!date && safeDuration > 0 && mode === "any",
    placeSportDayInput: {
      placeId: place?.id ?? "",
      sportId: sportId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
      includeCourtOptions,
      selectedAddons,
    },
  });

  const activeQuery = mode === "court" ? courtQuery : placeQuery;
  const responseData = activeQuery.data;
  const options = responseData?.options ?? [];
  const diagnostics = responseData?.diagnostics ?? emptyDiagnostics;

  const data = options.map((option) => ({
    id: `${option.courtId}-${option.startTime}-${safeDuration}`,
    startTime: option.startTime,
    endTime: option.endTime,
    totalPriceCents: option.totalPriceCents,
    currency: option.currency ?? "PHP",
    courtId: option.courtId,
    courtLabel: option.courtLabel,
    status: option.status,
    unavailableReason: option.unavailableReason ?? undefined,
    pricingWarnings: option.pricingWarnings ?? [],
    pricingBreakdown: option.pricingBreakdown ?? undefined,
    courtOptions: option.courtOptions ?? undefined,
  }));

  return {
    ...activeQuery,
    data,
    diagnostics,
  };
}
