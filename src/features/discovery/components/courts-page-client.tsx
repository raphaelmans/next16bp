"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { PlaceCardSkeleton } from "@/components/kudos";
import { Container } from "@/components/layout";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppliedFilterChips,
  DiscoveryPlaceCard,
  EmptyResults,
  PlaceFilters,
  PlaceFiltersSheet,
  PlaceMap,
  ViewToggle,
} from "@/features/discovery/components";
import {
  buildDiscoveryPlaceCard,
  useModDiscoveryFilters,
  useModDiscoveryPlaceSummaries,
  useModDiscoveryProgressivePlaceCardDetails,
  useModPlaceBookmarkBatch,
} from "@/features/discovery/hooks";
import { useQueryDiscoverySports } from "@/features/discovery/hooks/search";
import type { DiscoveryResolvedLocationState } from "@/features/discovery/query-options";

type PaginationItemModel =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

type LocationDefaults = {
  province?: string;
  city?: string;
  sportId?: string;
};

interface CourtsPageClientProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
  initialResolvedLocation?: DiscoveryResolvedLocationState;
}

const buildPaginationItems = (
  current: number,
  totalPages: number,
): PaginationItemModel[] => {
  if (totalPages <= 1) return [];

  const pages = new Set<number>([1, totalPages]);

  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: PaginationItemModel[] = [];

  sortedPages.forEach((page, index) => {
    if (index > 0) {
      const previous = sortedPages[index - 1];
      if (page - previous > 1) {
        items.push({
          type: "ellipsis",
          key: `ellipsis-${previous}-${page}`,
        });
      }
    }

    items.push({ type: "page", page });
  });

  return items;
};

export default function CourtsPageClient({
  initialFilters,
  initialLocationLabel,
  initialResolvedLocation,
}: CourtsPageClientProps) {
  return (
    <Suspense fallback={<CourtsPageSkeleton />}>
      <CourtsPageContent
        initialFilters={initialFilters}
        initialLocationLabel={initialLocationLabel}
        initialResolvedLocation={initialResolvedLocation}
      />
    </Suspense>
  );
}

interface CourtsPageContentProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
  initialResolvedLocation?: DiscoveryResolvedLocationState;
}

type StagedFilters = {
  q?: string | null;
  province?: string | null;
  city?: string | null;
  sportId?: string | null;
  date?: string | null;
  time?: string[] | null;
  amenities?: string[] | null;
  verification?:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable"
    | null;
};

function CourtsPageContent({
  initialFilters,
  initialLocationLabel,
  initialResolvedLocation,
}: CourtsPageContentProps) {
  const filters = useModDiscoveryFilters();
  const { data: sports = [] } = useQueryDiscoverySports();

  // ── Staged filter state (edits before Apply) ──
  const [staged, setStaged] = useState<StagedFilters>({
    q: filters.q,
    province: filters.province,
    city: filters.city,
    sportId: filters.sportId,
    date: filters.date,
    time: filters.time,
    amenities: filters.amenities,
    verification: filters.verification,
  });

  const updateStaged = useCallback((patch: Partial<StagedFilters>) => {
    setStaged((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyFilters = useCallback(() => {
    filters.setQuery(staged.q ?? "");
    filters.setProvince(staged.province ?? undefined);
    filters.setCity(staged.city ?? undefined);
    filters.setSportId(staged.sportId ?? undefined);
    filters.setDate(staged.date ?? undefined);
    filters.setTime(
      staged.time && staged.time.length > 0 ? staged.time : undefined,
    );
    filters.setAmenities(
      staged.amenities && staged.amenities.length > 0
        ? staged.amenities
        : undefined,
    );
    filters.setVerification(staged.verification ?? undefined);
  }, [filters, staged]);

  const clearAllFilters = useCallback(() => {
    filters.clearAll();
    setStaged({
      q: null,
      province: null,
      city: null,
      sportId: null,
      date: null,
      time: null,
      amenities: null,
      verification: null,
    });
  }, [filters]);

  // Staged filter handlers for PlaceFilters
  const stagedFilterHandlers = useMemo(
    () => ({
      onProvinceChange: (province: string | undefined) => {
        updateStaged({ province: province ?? null, city: null });
      },
      onCityChange: (city: string | undefined) => {
        updateStaged({ city: city ?? null });
      },
      onSportChange: (sportId: string | undefined) => {
        updateStaged({ sportId: sportId ?? null });
      },
      onDateChange: (date: string | undefined) => {
        updateStaged({
          date: date ?? null,
          time: date ? staged.time : null,
        });
      },
      onTimeChange: (time: string[] | undefined) => {
        updateStaged({ time: time ?? null });
      },
      onAmenitiesChange: (amenities: string[] | undefined) => {
        updateStaged({ amenities: amenities ?? null });
      },
      onVerificationChange: (
        verification:
          | "verified_reservable"
          | "curated"
          | "unverified_reservable"
          | undefined,
      ) => {
        updateStaged({ verification: verification ?? null });
      },
      onClearAll: () => {
        clearAllFilters();
      },
    }),
    [clearAllFilters, staged.time, updateStaged],
  );

  // ── Applied state (from URL = committed filters) ──
  const hasLocationDefaults = Boolean(
    initialFilters?.province || initialFilters?.city || initialFilters?.sportId,
  );
  const hasClearableFilters = Boolean(
    filters.q ||
      filters.province ||
      filters.city ||
      filters.sportId ||
      filters.date ||
      filters.time ||
      filters.verification ||
      (filters.amenities && filters.amenities.length > 0),
  );
  const resetLocationHref = hasLocationDefaults
    ? appRoutes.courts.base
    : undefined;
  const effectiveProvince =
    filters.province ?? initialFilters?.province ?? undefined;
  const effectiveCity = filters.city ?? initialFilters?.city ?? undefined;
  const effectiveSportId =
    filters.sportId ?? initialFilters?.sportId ?? undefined;

  // ── Query with committed (URL) filters (no debounce) ──
  const { data, isLoading } = useModDiscoveryPlaceSummaries({
    q: filters.q ?? undefined,
    province: effectiveProvince,
    city: effectiveCity,
    sportId: effectiveSportId,
    date: filters.date ?? undefined,
    time: filters.time ?? undefined,
    amenities: filters.amenities ?? undefined,
    verificationTier: filters.verification ?? undefined,
    page: filters.page,
    limit: filters.limit,
    initialResolvedLocation,
  });

  const placeSummaries = data?.places ?? [];
  const placeIds = useMemo(
    () => placeSummaries.map((place) => place.id),
    [placeSummaries],
  );
  const { mediaById, metaById, mediaLoadingIds, metaLoadingIds } =
    useModDiscoveryProgressivePlaceCardDetails(
      placeIds,
      effectiveSportId ?? undefined,
    );
  const {
    bookmarkedSet,
    toggleBookmark,
    isPending: isBookmarkPending,
    pendingPlaceId,
  } = useModPlaceBookmarkBatch(placeIds);
  const places = useMemo(
    () =>
      placeSummaries.map((summary) =>
        buildDiscoveryPlaceCard(
          summary,
          mediaById[summary.id],
          metaById[summary.id],
        ),
      ),
    [placeSummaries, mediaById, metaById],
  );
  const availabilityPreviewByPlaceId = useMemo(
    () =>
      Object.fromEntries(
        placeSummaries
          .filter((summary) => summary.availabilityPreview)
          .map((summary) => [summary.id, summary.availabilityPreview]),
      ),
    [placeSummaries],
  );
  const mapPlaces = useMemo(
    () =>
      placeSummaries.map((summary) => ({
        ...buildDiscoveryPlaceCard(
          summary,
          mediaById[summary.id],
          metaById[summary.id],
        ),
        lat: summary.latitude,
        lng: summary.longitude,
      })),
    [placeSummaries, mediaById, metaById],
  );
  const total = data?.total ?? 0;
  const page = filters.page;
  const limit = data?.limit ?? filters.limit;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages],
  );
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);
  const { data: provincesCities } = usePHProvincesCitiesQuery();

  const locationLabel = useMemo(() => {
    if (!provincesCities) {
      const matchesInitialLocation =
        effectiveProvince === initialResolvedLocation?.provinceSlug &&
        effectiveCity === initialResolvedLocation?.citySlug;

      return (
        initialLocationLabel ??
        (matchesInitialLocation
          ? (initialResolvedLocation?.cityName ??
            initialResolvedLocation?.provinceName)
          : null) ??
        effectiveCity ??
        effectiveProvince ??
        null
      );
    }

    const province = effectiveProvince
      ? findProvinceBySlug(provincesCities, effectiveProvince)
      : null;
    const city = effectiveCity
      ? (findCityBySlug(province, effectiveCity) ??
        findCityBySlugAcrossProvinces(provincesCities, effectiveCity)?.city ??
        null)
      : null;

    return city?.displayName ?? province?.displayName ?? null;
  }, [
    effectiveCity,
    effectiveProvince,
    initialLocationLabel,
    initialResolvedLocation,
    provincesCities,
  ]);

  // ── Applied chip removal handlers (write directly to URL) ──
  const removeProvince = useCallback(() => {
    filters.setProvince(undefined);
    updateStaged({ province: null, city: null });
  }, [filters, updateStaged]);

  const removeCity = useCallback(() => {
    filters.setCity(undefined);
    updateStaged({ city: null });
  }, [filters, updateStaged]);

  const removeSport = useCallback(() => {
    filters.setSportId(undefined);
    updateStaged({ sportId: null });
  }, [filters, updateStaged]);

  const removeDate = useCallback(() => {
    filters.setDate(undefined);
    updateStaged({ date: null, time: null });
  }, [filters, updateStaged]);

  const removeTime = useCallback(
    (hour: string) => {
      const next = (filters.time ?? []).filter((t) => t !== hour);
      filters.setTime(next.length > 0 ? next : undefined);
      updateStaged({ time: next.length > 0 ? next : null });
    },
    [filters, updateStaged],
  );

  const removeAmenity = useCallback(
    (amenity: string) => {
      const next = (filters.amenities ?? []).filter((a) => a !== amenity);
      filters.setAmenities(next.length > 0 ? next : undefined);
      updateStaged({ amenities: next.length > 0 ? next : null });
    },
    [filters, updateStaged],
  );

  const removeVerification = useCallback(() => {
    filters.setVerification(undefined);
    updateStaged({ verification: null });
  }, [filters, updateStaged]);

  const filterProps = {
    amenities: staged.amenities ?? undefined,
    province: staged.province ?? effectiveProvince ?? undefined,
    city: staged.city ?? effectiveCity ?? undefined,
    sportId: staged.sportId ?? effectiveSportId ?? undefined,
    date: staged.date ?? filters.date ?? undefined,
    time: staged.time ?? filters.time ?? undefined,
    verification: staged.verification ?? filters.verification ?? undefined,
    hasClearableFilters,
    resetLocationHref,
    ...stagedFilterHandlers,
  } as const;

  return (
    <Container>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {locationLabel ? `Courts in ${locationLabel}` : "Browse Courts"}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span>
                  {total} result{total !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-border">|</span>
              <Link
                href={appRoutes.submitCourt.base}
                className="text-primary hover:underline"
              >
                Add a court
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <PlaceFiltersSheet {...filterProps} onApply={applyFilters} />
            <ViewToggle value={filters.view} onChange={filters.setView} />
          </div>
        </div>

        {/* Desktop filters */}
        <PlaceFilters
          layout="desktop"
          {...filterProps}
          onApply={applyFilters}
        />

        {/* Applied filter chips */}
        <AppliedFilterChips
          province={filters.province}
          city={filters.city}
          sportId={filters.sportId}
          date={filters.date}
          time={filters.time}
          amenities={filters.amenities}
          verification={filters.verification}
          sports={sports}
          onRemoveProvince={removeProvince}
          onRemoveCity={removeCity}
          onRemoveSport={removeSport}
          onRemoveDate={removeDate}
          onRemoveTime={removeTime}
          onRemoveAmenity={removeAmenity}
          onRemoveVerification={removeVerification}
        />

        {/* Results */}
        {filters.view === "map" ? (
          <PlaceMap places={mapPlaces} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : places.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {places.map((place) => (
                <DiscoveryPlaceCard
                  key={place.id}
                  place={place}
                  availabilityPreview={availabilityPreviewByPlaceId[place.id]}
                  isMediaLoading={mediaLoadingIds.has(place.id)}
                  isMetaLoading={metaLoadingIds.has(place.id)}
                  isBookmarked={bookmarkedSet.has(place.id)}
                  isBookmarkPending={
                    isBookmarkPending && pendingPlaceId === place.id
                  }
                  onBookmarkToggle={() => toggleBookmark(place.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => filters.setPage(Math.max(1, page - 1))}
                        className={
                          page === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {paginationItems.map((item) =>
                      item.type === "page" ? (
                        <PaginationItem key={`page-${item.page}`}>
                          <PaginationLink
                            onClick={() => filters.setPage(item.page)}
                            isActive={page === item.page}
                            className="cursor-pointer"
                          >
                            {item.page}
                          </PaginationLink>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item.key}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          filters.setPage(Math.min(totalPages, page + 1))
                        }
                        className={
                          page === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-xs text-muted-foreground">
                  {startIndex}–{endIndex} of {total}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyResults
            query={filters.q ?? undefined}
            onClearFilters={hasClearableFilters ? clearAllFilters : undefined}
          />
        )}
      </div>
    </Container>
  );
}

function CourtsPageSkeleton() {
  return (
    <Container>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[120px] rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
