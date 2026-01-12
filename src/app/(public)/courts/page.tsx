"use client";

import { Suspense } from "react";
import {
  EmptyResults,
  PlaceFilters,
  PlaceMap,
  ViewToggle,
} from "@/features/discovery/components";
import {
  useDiscoveryFilters,
  useDiscoveryPlaces,
} from "@/features/discovery/hooks";
import {
  AdBanner,
  PlaceCard,
  PlaceCardSkeleton,
} from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";

export default function PlacesPage() {
  return (
    <Suspense fallback={<PlacesPageSkeleton />}>
      <PlacesPageContent />
    </Suspense>
  );
}

function PlacesPageContent() {
  const filters = useDiscoveryFilters();
  const { data, isLoading } = useDiscoveryPlaces({
    q: filters.q ?? undefined,
    city: filters.city ?? undefined,
    sportId: filters.sportId ?? undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const places = data?.places ?? [];
  const total = data?.total ?? 0;

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {filters.city ? `Places in ${filters.city}` : "Browse Places"}
            </h1>
            {!isLoading && (
              <p className="text-muted-foreground">
                {total} place{total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle value={filters.view} onChange={filters.setView} />
          </div>
        </div>

        <PlaceFilters
          city={filters.city ?? undefined}
          sportId={filters.sportId ?? undefined}
          onCityChange={filters.setCity}
          onSportChange={filters.setSportId}
          onClearAll={filters.clearAll}
        />

        {filters.view === "map" ? (
          <PlaceMap
            places={places.map((place, index) => {
              const fallbackLat = 14.5995 + index * 0.001;
              const fallbackLng = 120.9842 + index * 0.001;
              return {
                ...place,
                lat: place.latitude ?? fallbackLat,
                lng: place.longitude ?? fallbackLng,
              };
            })}
          />
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
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>

            <AdBanner placement="search-results" className="mt-8" />

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

function PlacesPageSkeleton() {
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
