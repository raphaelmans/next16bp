"use client";

import { Suspense } from "react";
import {
  CourtFilters,
  CourtMap,
  EmptyResults,
  ViewToggle,
} from "@/features/discovery/components";
import {
  useDiscoveryCourts,
  useDiscoveryFilters,
} from "@/features/discovery/hooks";
import {
  AdBanner,
  CourtCard,
  CourtCardSkeleton,
} from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";

export default function CourtsPage() {
  return (
    <Suspense fallback={<CourtsPageSkeleton />}>
      <CourtsPageContent />
    </Suspense>
  );
}

function CourtsPageContent() {
  const filters = useDiscoveryFilters();
  const { data, isLoading } = useDiscoveryCourts({
    q: filters.q ?? undefined,
    city: filters.city ?? undefined,
    type: filters.type ?? undefined,
    isFree: filters.isFree ?? undefined,
    amenities: filters.amenities,
    page: filters.page,
    limit: filters.limit,
  });

  const courts = data?.courts ?? [];
  const total = data?.total ?? 0;

  return (
    <Container>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {filters.city
                ? `Courts in ${filters.city.charAt(0).toUpperCase() + filters.city.slice(1)}`
                : "Browse Courts"}
            </h1>
            {!isLoading && (
              <p className="text-muted-foreground">
                {total} court{total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle value={filters.view} onChange={filters.setView} />
          </div>
        </div>

        {/* Filters */}
        <CourtFilters
          city={filters.city ?? undefined}
          type={filters.type ?? undefined}
          isFree={filters.isFree ?? undefined}
          amenities={filters.amenities}
          onCityChange={filters.setCity}
          onTypeChange={(t) =>
            filters.setType(t as "CURATED" | "RESERVABLE" | undefined)
          }
          onIsFreeChange={filters.setIsFree}
          onAmenitiesChange={filters.setAmenities}
          onClearAll={filters.clearAll}
        />

        {/* Content */}
        {filters.view === "map" ? (
          <CourtMap
            courts={courts.map((c) => ({
              ...c,
              lat: 14.5995 + Math.random() * 0.1,
              lng: 120.9842 + Math.random() * 0.1,
            }))}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"].map(
              (id) => (
                <CourtCardSkeleton key={id} />
              ),
            )}
          </div>
        ) : courts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courts.map((court) => (
                <CourtCard key={court.id} court={court} />
              ))}
            </div>

            {/* Ad Banner */}
            <AdBanner placement="search-results" className="mt-8" />

            {/* Pagination placeholder */}
            {data?.hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  type="button"
                  onClick={() => filters.setPage(filters.page + 1)}
                  className="text-primary hover:underline"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyResults
            query={filters.q ?? undefined}
            onClearFilters={filters.clearAll}
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
            <CourtCardSkeleton key={id} />
          ))}
        </div>
      </div>
    </Container>
  );
}
