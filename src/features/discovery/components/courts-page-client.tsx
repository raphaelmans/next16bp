"use client";

import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { AdBanner, PlaceCard, PlaceCardSkeleton } from "@/components/kudos";
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
import {
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
import {
  DISCOVERY_VISIBLE_CHUNK_SIZE,
  type DiscoveryResolvedLocationState,
} from "@/features/discovery/query-options";

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

function CourtsPageContent({
  initialFilters,
  initialLocationLabel,
  initialResolvedLocation,
}: CourtsPageContentProps) {
  const filters = useModDiscoveryFilters();
  const hasLocationDefaults = Boolean(
    initialFilters?.province || initialFilters?.city || initialFilters?.sportId,
  );
  const hasClearableFilters = Boolean(
    filters.q ||
      filters.province ||
      filters.city ||
      filters.sportId ||
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
  const { data, isLoading } = useModDiscoveryPlaceSummaries({
    q: filters.q ?? undefined,
    province: effectiveProvince ?? undefined,
    city: effectiveCity ?? undefined,
    sportId: effectiveSportId ?? undefined,
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
  const [visibleChunkCount, setVisibleChunkCount] = useState(1);
  const chunkSentinelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const totalChunks = Math.max(
    1,
    Math.ceil(placeIds.length / DISCOVERY_VISIBLE_CHUNK_SIZE),
  );

  useEffect(() => {
    if (filters.view === "map") {
      setVisibleChunkCount(Math.max(1, totalChunks));
      return;
    }

    setVisibleChunkCount(1);
  }, [filters.view, totalChunks]);

  useEffect(() => {
    if (filters.view !== "list") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-chunk-index"));
          if (!Number.isFinite(index)) continue;
          setVisibleChunkCount((current) => Math.max(current, index + 2));
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    for (const sentinel of chunkSentinelRefs.current) {
      if (sentinel) {
        observer.observe(sentinel);
      }
    }

    return () => observer.disconnect();
  }, [filters.view]);

  const { mediaById, metaById, mediaLoadingIds, metaLoadingIds } =
    useModDiscoveryProgressivePlaceCardDetails(
      placeIds,
      effectiveSportId ?? undefined,
      visibleChunkCount,
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
  const placeChunks = useMemo(() => {
    const chunks: Array<typeof places> = [];
    for (
      let index = 0;
      index < places.length;
      index += DISCOVERY_VISIBLE_CHUNK_SIZE
    ) {
      chunks.push(places.slice(index, index + DISCOVERY_VISIBLE_CHUNK_SIZE));
    }
    return chunks;
  }, [places]);

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

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {locationLabel ? `Courts in ${locationLabel}` : "Browse Courts"}
            </h1>
            {!isLoading && (
              <p className="text-muted-foreground">
                {total} court{total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={appRoutes.submitCourt.base}
              className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              Know a court? Add it!
            </Link>
            <PlaceFiltersSheet
              amenities={filters.amenities ?? undefined}
              province={effectiveProvince ?? undefined}
              city={effectiveCity ?? undefined}
              sportId={effectiveSportId ?? undefined}
              verification={filters.verification ?? undefined}
              hasClearableFilters={hasClearableFilters}
              resetLocationHref={resetLocationHref}
              onAmenitiesChange={filters.setAmenities}
              onProvinceChange={filters.setProvince}
              onCityChange={filters.setCity}
              onSportChange={filters.setSportId}
              onVerificationChange={filters.setVerification}
              onClearAll={filters.clearAll}
            />
            <ViewToggle value={filters.view} onChange={filters.setView} />
          </div>
        </div>

        <PlaceFilters
          layout="desktop"
          amenities={filters.amenities ?? undefined}
          province={effectiveProvince ?? undefined}
          city={effectiveCity ?? undefined}
          sportId={effectiveSportId ?? undefined}
          verification={filters.verification ?? undefined}
          hasClearableFilters={hasClearableFilters}
          resetLocationHref={resetLocationHref}
          onAmenitiesChange={filters.setAmenities}
          onProvinceChange={filters.setProvince}
          onCityChange={filters.setCity}
          onSportChange={filters.setSportId}
          onVerificationChange={filters.setVerification}
          onClearAll={filters.clearAll}
        />

        {filters.view === "map" ? (
          <PlaceMap places={mapPlaces} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"].map(
              (id) => (
                <PlaceCardSkeleton key={id} />
              ),
            )}
          </div>
        ) : places.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {placeChunks.map((chunk, chunkIndex) => (
                <Fragment
                  key={`${chunk[0]?.id ?? "start"}-${chunk[chunk.length - 1]?.id ?? "end"}`}
                >
                  {chunk.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isMediaLoading={mediaLoadingIds.has(place.id)}
                      isMetaLoading={metaLoadingIds.has(place.id)}
                      isBookmarked={bookmarkedSet.has(place.id)}
                      isBookmarkPending={
                        isBookmarkPending && pendingPlaceId === place.id
                      }
                      onBookmarkToggle={() => toggleBookmark(place.id)}
                    />
                  ))}
                  {chunkIndex < placeChunks.length - 1 &&
                  filters.view === "list" ? (
                    <div
                      ref={(node) => {
                        chunkSentinelRefs.current[chunkIndex] = node;
                      }}
                      data-chunk-index={chunkIndex}
                      className="col-span-full h-px"
                      aria-hidden="true"
                    />
                  ) : null}
                </Fragment>
              ))}
            </div>

            <AdBanner placement="search-results" className="mt-8" />

            {totalPages > 1 && (
              <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex}-{endIndex} of {total}
                </p>
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
              </div>
            )}
          </>
        ) : (
          <EmptyResults
            query={filters.q ?? undefined}
            onClearFilters={hasClearableFilters ? filters.clearAll : undefined}
          />
        )}
      </div>
    </Container>
  );
}

function CourtsPageSkeleton() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"].map((id) => (
            <PlaceCardSkeleton key={id} />
          ))}
        </div>
      </div>
    </Container>
  );
}
