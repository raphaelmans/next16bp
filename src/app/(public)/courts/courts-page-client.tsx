"use client";

import { Suspense, useMemo } from "react";
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
  useDiscoveryFilters,
  useDiscoveryPlaceCardDetails,
  useDiscoveryPlaceSummaries,
} from "@/features/discovery/hooks";

type PaginationItemModel =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

type LocationDefaults = {
  province?: string;
  city?: string;
};

interface CourtsPageClientProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
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
}: CourtsPageClientProps) {
  return (
    <Suspense fallback={<CourtsPageSkeleton />}>
      <CourtsPageContent
        initialFilters={initialFilters}
        initialLocationLabel={initialLocationLabel}
      />
    </Suspense>
  );
}

interface CourtsPageContentProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
}

function CourtsPageContent({
  initialFilters,
  initialLocationLabel,
}: CourtsPageContentProps) {
  const filters = useDiscoveryFilters();
  const hasLocationDefaults = Boolean(
    initialFilters?.province || initialFilters?.city,
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
  const { data, isLoading } = useDiscoveryPlaceSummaries({
    q: filters.q ?? undefined,
    province: effectiveProvince ?? undefined,
    city: effectiveCity ?? undefined,
    sportId: filters.sportId ?? undefined,
    amenities: filters.amenities ?? undefined,
    verificationTier: filters.verification ?? undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const placeSummaries = data?.places ?? [];
  const placeIds = useMemo(
    () => placeSummaries.map((place) => place.id),
    [placeSummaries],
  );
  const { mediaById, metaById, isMediaLoading, isMetaLoading } =
    useDiscoveryPlaceCardDetails(placeIds, filters.sportId ?? undefined);
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

  const locationLabel = useMemo(() => {
    if (!provincesCities) {
      return initialLocationLabel ?? effectiveCity ?? effectiveProvince ?? null;
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
  }, [effectiveCity, effectiveProvince, initialLocationLabel, provincesCities]);

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
            <PlaceFiltersSheet
              amenities={filters.amenities ?? undefined}
              province={effectiveProvince ?? undefined}
              city={effectiveCity ?? undefined}
              sportId={filters.sportId ?? undefined}
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
          sportId={filters.sportId ?? undefined}
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
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isMediaLoading={isMediaLoading}
                  isMetaLoading={isMetaLoading}
                />
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
