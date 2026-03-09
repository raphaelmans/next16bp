"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  useModPlaceBookmarkBatch,
} from "@/features/discovery/hooks";
import { useQueryDiscoverySports } from "@/features/discovery/hooks/search";
import type {
  DiscoveryLocationDefaults,
  DiscoveryLocationRouteScope,
} from "@/features/discovery/location-routing";
import type { PublicCourtsPageData } from "@/features/discovery/public-courts-data";
import type { DiscoveryResolvedLocationState } from "@/features/discovery/query-options";
import { cn } from "@/lib/utils";
import { useSearchNavigationProgress } from "./search-navigation-progress-provider";

type PaginationItemModel =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

interface CourtsPageClientProps {
  initialData: PublicCourtsPageData;
  initialFilters?: DiscoveryLocationDefaults;
  initialLocationLabel?: string;
  locationRouteScope?: DiscoveryLocationRouteScope;
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
  initialData,
  initialFilters,
  initialLocationLabel,
  locationRouteScope = "none",
  initialResolvedLocation,
}: CourtsPageClientProps) {
  return (
    <Suspense fallback={<CourtsPageSkeleton />}>
      <CourtsPageContent
        initialData={initialData}
        initialFilters={initialFilters}
        initialLocationLabel={initialLocationLabel}
        locationRouteScope={locationRouteScope}
        initialResolvedLocation={initialResolvedLocation}
      />
    </Suspense>
  );
}

interface CourtsPageContentProps {
  initialData: PublicCourtsPageData;
  initialFilters?: DiscoveryLocationDefaults;
  initialLocationLabel?: string;
  locationRouteScope?: DiscoveryLocationRouteScope;
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
  initialData,
  initialFilters,
  initialLocationLabel,
  locationRouteScope = "none",
  initialResolvedLocation,
}: CourtsPageContentProps) {
  const { isSearchNavigationPending, finishSearchNavigation } =
    useSearchNavigationProgress();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: sports = [] } = useQueryDiscoverySports();
  const filters = useModDiscoveryFilters({
    initialFilters,
    locationRouteScope,
    sports: sports.map((sport) => ({ id: sport.id, slug: sport.slug })),
  });
  const isFiltering = filters.isPending || isSearchNavigationPending;
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [hasMeasuredResultsAnchor, setHasMeasuredResultsAnchor] =
    useState(false);
  const [isResultsAnchorVisible, setIsResultsAnchorVisible] = useState(false);
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false);

  useEffect(() => {
    finishSearchNavigation();
  }, [finishSearchNavigation]);

  const queueResultsScroll = useCallback(() => {
    setShouldScrollToResults(true);
  }, []);

  useEffect(() => {
    const anchor = resultsAnchorRef.current;

    if (!anchor) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHasMeasuredResultsAnchor(true);
        setIsResultsAnchorVisible(entry?.isIntersecting ?? false);
      },
      {
        rootMargin: "-96px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollToResults || isFiltering || !hasMeasuredResultsAnchor) {
      return;
    }

    setShouldScrollToResults(false);

    if (filters.view !== "list" || isResultsAnchorVisible) {
      return;
    }

    resultsAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [
    filters.view,
    hasMeasuredResultsAnchor,
    isFiltering,
    isResultsAnchorVisible,
    shouldScrollToResults,
  ]);

  // ── Staged filter state (edits before Apply) ──
  const [staged, setStaged] = useState<StagedFilters>({
    q: filters.q,
    province: filters.province ?? initialFilters?.province ?? null,
    city: filters.city ?? initialFilters?.city ?? null,
    sportId: filters.sportId ?? initialFilters?.sportId ?? null,
    date: filters.date,
    time: filters.time,
    amenities: filters.amenities,
    verification: filters.verification,
  });

  const updateStaged = useCallback((patch: Partial<StagedFilters>) => {
    setStaged((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyFilters = useCallback(() => {
    queueResultsScroll();
    filters.commitFilters({
      q: staged.q ?? null,
      province: staged.province ?? null,
      city: staged.city ?? null,
      sportId: staged.sportId ?? null,
      date: staged.date ?? null,
      time: staged.time ?? null,
      amenities: staged.amenities ?? null,
      verification: staged.verification ?? null,
      page: 1,
    });
  }, [filters, queueResultsScroll, staged]);

  const clearAllFilters = useCallback(() => {
    queueResultsScroll();
    filters.clearAll();
    setStaged({
      q: null,
      province:
        locationRouteScope === "none"
          ? null
          : (initialFilters?.province ?? null),
      city:
        locationRouteScope === "city" || locationRouteScope === "sport"
          ? (initialFilters?.city ?? null)
          : null,
      sportId:
        locationRouteScope === "sport"
          ? (initialFilters?.sportId ?? null)
          : null,
      date: null,
      time: null,
      amenities: null,
      verification: null,
    });
  }, [filters, initialFilters, locationRouteScope, queueResultsScroll]);

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

  const placeSummaries = initialData.places;
  const placeIds = useMemo(
    () => placeSummaries.map((place) => place.id),
    [placeSummaries],
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
        buildDiscoveryPlaceCard(summary, initialData.mediaById[summary.id]),
      ),
    [initialData.mediaById, placeSummaries],
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
        ...buildDiscoveryPlaceCard(summary, initialData.mediaById[summary.id]),
        lat: summary.latitude,
        lng: summary.longitude,
      })),
    [initialData.mediaById, placeSummaries],
  );
  const total = initialData.total;
  const page = filters.page;
  const limit = initialData.limit;
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
    queueResultsScroll();
    filters.setProvince(undefined);
    updateStaged({ province: null, city: null, sportId: null });
  }, [filters, queueResultsScroll, updateStaged]);

  const removeCity = useCallback(() => {
    queueResultsScroll();
    filters.setCity(undefined);
    updateStaged({ city: null, sportId: null });
  }, [filters, queueResultsScroll, updateStaged]);

  const removeSport = useCallback(() => {
    queueResultsScroll();
    filters.setSportId(undefined);
    updateStaged({ sportId: null });
  }, [filters, queueResultsScroll, updateStaged]);

  const removeDate = useCallback(() => {
    queueResultsScroll();
    filters.setDate(undefined);
    updateStaged({ date: null, time: null });
  }, [filters, queueResultsScroll, updateStaged]);

  const removeTime = useCallback(
    (hour: string) => {
      queueResultsScroll();
      const next = (filters.time ?? []).filter((t) => t !== hour);
      filters.setTime(next.length > 0 ? next : undefined);
      updateStaged({ time: next.length > 0 ? next : null });
    },
    [filters, queueResultsScroll, updateStaged],
  );

  const removeAmenity = useCallback(
    (amenity: string) => {
      queueResultsScroll();
      const next = (filters.amenities ?? []).filter((a) => a !== amenity);
      filters.setAmenities(next.length > 0 ? next : undefined);
      updateStaged({ amenities: next.length > 0 ? next : null });
    },
    [filters, queueResultsScroll, updateStaged],
  );

  const removeVerification = useCallback(() => {
    queueResultsScroll();
    filters.setVerification(undefined);
    updateStaged({ verification: null });
  }, [filters, queueResultsScroll, updateStaged]);

  const handleViewChange = useCallback(
    (view: "list" | "map") => {
      if (view === "list" && filters.view !== "list") {
        queueResultsScroll();
      }

      filters.setView(view);
    },
    [filters, queueResultsScroll],
  );

  const buildPaginationHref = useCallback(
    (nextPage: number) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) {
        nextSearchParams.delete("page");
      } else {
        nextSearchParams.set("page", String(nextPage));
      }

      const queryString = nextSearchParams.toString();

      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParams],
  );

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
    <Container className="pt-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {locationLabel ? `Venues in ${locationLabel}` : "Browse Venues"}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {total} result{total !== 1 ? "s" : ""}
              </span>
              <span className="text-border">|</span>
              <Link
                href={appRoutes.submitVenue.base}
                className="text-primary hover:underline"
              >
                Add a venue
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <PlaceFiltersSheet {...filterProps} onApply={applyFilters} />
            <ViewToggle value={filters.view} onChange={handleViewChange} />
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
          province={effectiveProvince}
          city={effectiveCity}
          sportId={effectiveSportId}
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

        {/* Inline filter progress bar */}
        <div
          className={cn(
            "relative h-[3px] w-full overflow-hidden rounded-full transition-opacity duration-200",
            isFiltering ? "opacity-100 bg-primary/20" : "opacity-0",
          )}
          role="progressbar"
          aria-label="Filtering"
          aria-busy={isFiltering}
        >
          <div className="absolute inset-0 h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent animate-[filter-slide_1s_ease-in-out_infinite]" />
        </div>

        {/* Results */}
        <div
          ref={resultsAnchorRef}
          aria-hidden="true"
          className="block h-px scroll-mt-24"
        />
        {filters.view === "map" ? (
          <PlaceMap places={mapPlaces} />
        ) : places.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {places.map((place) => (
                <DiscoveryPlaceCard
                  key={place.id}
                  place={place}
                  availabilityPreview={availabilityPreviewByPlaceId[place.id]}
                  isMediaLoading={false}
                  isMetaLoading={false}
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
                        href={buildPaginationHref(Math.max(1, page - 1))}
                        scroll={false}
                        aria-disabled={page === 1}
                        onClick={queueResultsScroll}
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
                            href={buildPaginationHref(item.page)}
                            scroll={false}
                            onClick={queueResultsScroll}
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
                        href={buildPaginationHref(
                          Math.min(totalPages, page + 1),
                        )}
                        scroll={false}
                        aria-disabled={page === totalPages}
                        onClick={queueResultsScroll}
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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[120px] rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
