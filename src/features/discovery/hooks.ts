"use client";

import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { getZonedStartOfDayIso, toUtcISOString } from "@/common/time-zone";
import type { PlaceCardPlace, TimeSlot } from "@/components/kudos";
import {
  mapPlaceSummary,
  type PlaceSummary,
} from "@/features/discovery/helpers";
import { trpc } from "@/trpc/client";
import { searchParamsSchema } from "./schemas";

// ============================================================================
// From use-court-detail.ts
// ============================================================================

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

// ============================================================================
// From use-discovery-filters.ts
// ============================================================================

/**
 * Hook to manage discovery filter state via URL
 */
export function useDiscoveryFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsSchema, {
    shallow: false,
  });

  const clearAll = () => {
    setFilters({
      q: null,
      province: null,
      city: null,
      sportId: null,
      amenities: null,
      verification: null,
      page: 1,
    });
  };

  const setProvince = (province: string | undefined) => {
    setFilters({ province: province || null, city: null, page: 1 });
  };

  const setCity = (city: string | undefined) => {
    setFilters({ city: city || null, page: 1 });
  };

  const setSportId = (sportId: string | undefined) => {
    setFilters({ sportId: sportId || null, page: 1 });
  };

  const setAmenities = (amenities: string[] | undefined) => {
    setFilters({
      amenities: amenities && amenities.length > 0 ? amenities : null,
      page: 1,
    });
  };

  const setVerification = (
    verification:
      | "verified_reservable"
      | "curated"
      | "unverified_reservable"
      | undefined,
  ) => {
    setFilters({ verification: verification ?? null, page: 1 });
  };

  const setView = (view: "list" | "map") => {
    setFilters({ view });
  };

  const setPage = (page: number) => {
    setFilters({ page });
  };

  const setQuery = (q: string) => {
    setFilters({ q: q || null, page: 1 });
  };

  return {
    ...filters,
    setProvince,
    setCity,
    setSportId,
    setAmenities,
    setVerification,
    setView,
    setPage,
    setQuery,
    clearAll,
  };
}

// ============================================================================
// From use-discovery.ts
// ============================================================================

interface UseDiscoveryOptions {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  amenities?: string[];
  verificationTier?:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable";
  page?: number;
  limit?: number;
}

export interface DiscoveryPlaceSummary {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  placeType?: "CURATED" | "RESERVABLE";
  featuredRank?: number;
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
}

interface PlaceSummaryListItem {
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    placeType?: "CURATED" | "RESERVABLE";
    featuredRank?: number | null;
  };
}

interface DiscoveryResult {
  places: PlaceSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface DiscoverySummaryResult {
  places: DiscoveryPlaceSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type { PlaceSummary };

const mapPlaceSummaryItem = (
  item: PlaceSummaryListItem,
): DiscoveryPlaceSummary => {
  const latitude = Number.parseFloat(item.place.latitude ?? "");
  const longitude = Number.parseFloat(item.place.longitude ?? "");

  return {
    id: item.place.id,
    slug: item.place.slug ?? undefined,
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    placeType: item.place.placeType,
    featuredRank: item.place.featuredRank ?? 0,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};

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
});

export function useDiscoveryPlaces(options: UseDiscoveryOptions = {}) {
  const {
    q,
    province,
    city,
    sportId,
    amenities,
    verificationTier,
    page = 1,
    limit = 12,
  } = options;
  const offset = (page - 1) * limit;
  const { data: provincesCities } = usePHProvincesCitiesQuery();

  const resolvedLocation = useMemo(() => {
    if (!provincesCities) return null;

    const resolvedProvince = province
      ? findProvinceBySlug(provincesCities, province)
      : null;
    const resolvedCity = city
      ? (findCityBySlug(resolvedProvince, city) ??
        findCityBySlugAcrossProvinces(provincesCities, city)?.city ??
        null)
      : null;

    return {
      province: resolvedProvince?.name,
      city: resolvedCity?.name,
    };
  }, [city, province, provincesCities]);

  const query = trpc.place.list.useQuery({
    q,
    province: resolvedLocation?.province ?? undefined,
    city: resolvedLocation?.city ?? undefined,
    sportId,
    amenities,
    verificationTier,
    limit,
    offset,
  });

  const transformedData: DiscoveryResult | undefined = query.data
    ? {
        places: query.data.items.map(mapPlaceSummary),
        total: query.data.total,
        page,
        limit,
        hasMore: offset + query.data.items.length < query.data.total,
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  } as typeof query & { data: DiscoveryResult | undefined };
}

export function useDiscoveryPlaceSummaries(options: UseDiscoveryOptions = {}) {
  const {
    q,
    province,
    city,
    sportId,
    amenities,
    verificationTier,
    page = 1,
    limit = 12,
  } = options;
  const offset = (page - 1) * limit;
  const { data: provincesCities } = usePHProvincesCitiesQuery();

  const resolvedLocation = useMemo(() => {
    if (!provincesCities) return null;

    const resolvedProvince = province
      ? findProvinceBySlug(provincesCities, province)
      : null;
    const resolvedCity = city
      ? (findCityBySlug(resolvedProvince, city) ??
        findCityBySlugAcrossProvinces(provincesCities, city)?.city ??
        null)
      : null;

    return {
      province: resolvedProvince?.name,
      city: resolvedCity?.name,
    };
  }, [city, province, provincesCities]);

  const query = trpc.place.listSummary.useQuery({
    q,
    province: resolvedLocation?.province ?? undefined,
    city: resolvedLocation?.city ?? undefined,
    sportId,
    amenities,
    verificationTier,
    limit,
    offset,
  });

  const transformedData: DiscoverySummaryResult | undefined = query.data
    ? {
        places: query.data.items.map(mapPlaceSummaryItem),
        total: query.data.total,
        page,
        limit,
        hasMore: offset + query.data.items.length < query.data.total,
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  } as typeof query & { data: DiscoverySummaryResult | undefined };
}

export function useDiscoveryPlaceCardDetails(
  placeIds: string[],
  sportId?: string,
) {
  const queries = trpc.useQueries((t) => [
    t.place.cardMediaByIds({ placeIds }, { enabled: placeIds.length > 0 }),
    t.place.cardMetaByIds(
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

export function useFeaturedPlaces(limit = 6) {
  const query = trpc.place.list.useQuery({
    featuredOnly: true,
    limit,
    offset: 0,
  });

  const places: PlaceSummary[] = query.data
    ? query.data.items.map(mapPlaceSummary)
    : [];

  return {
    ...query,
    data: places,
  } as typeof query & { data: PlaceSummary[] };
}

// ============================================================================
// From use-place-detail.ts
// ============================================================================

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
  contactDetail?: PlaceContactDetail;
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

export interface AvailabilityDiagnostics {
  hasHoursWindows: boolean;
  hasRateRules: boolean;
  dayHasHours: boolean;
  allSlotsBooked: boolean;
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

export function usePlaceDetail({ placeIdOrSlug }: UsePlaceDetailOptions) {
  return trpc.place.getByIdOrSlug.useQuery(
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
          contactDetail,
        } satisfies PlaceDetail;
      },
    },
  );
}

interface UsePlaceAvailabilityOptions {
  place?: PlaceDetail;
  sportId?: string;
  courtId?: string;
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
};

export function usePlaceAvailability({
  place,
  sportId,
  courtId,
  date,
  durationMinutes,
  mode,
  includeUnavailable,
  includeCourtOptions,
}: UsePlaceAvailabilityOptions) {
  const dateIso = getDateIso(date, place?.timeZone);
  const safeDuration = Number.isFinite(durationMinutes) ? durationMinutes : 0;

  const courtQuery = trpc.availability.getForCourt.useQuery(
    {
      courtId: courtId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
    },
    {
      enabled:
        !!courtId &&
        !!date &&
        safeDuration > 0 &&
        mode === "court" &&
        !!place?.id,
    },
  );

  const placeQuery = trpc.availability.getForPlaceSport.useQuery(
    {
      placeId: place?.id ?? "",
      sportId: sportId ?? "",
      date: dateIso,
      durationMinutes: safeDuration,
      includeUnavailable,
      includeCourtOptions,
    },
    {
      enabled:
        !!place?.id &&
        !!sportId &&
        !!date &&
        safeDuration > 0 &&
        mode === "any",
    },
  );

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
    courtOptions: option.courtOptions ?? undefined,
  }));

  return {
    ...activeQuery,
    data,
    diagnostics,
  };
}
