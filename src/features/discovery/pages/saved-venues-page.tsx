"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { PlaceCard, PlaceCardSkeleton } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  buildDiscoveryPlaceCard,
  useModDiscoveryPlaceCardDetails,
  useModPlaceBookmarkBatch,
  useModPlaceBookmarkList,
} from "@/features/discovery/hooks";

const PAGE_SIZE = 20;

export function SavedVenuesPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useModPlaceBookmarkList({
    limit: PAGE_SIZE,
    offset,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const placeIds = useMemo(() => items.map((item) => item.placeId), [items]);

  const { mediaById, metaById, isMediaLoading, isMetaLoading } =
    useModDiscoveryPlaceCardDetails(placeIds);

  const {
    bookmarkedSet,
    toggleBookmark,
    isPending: isBookmarkPending,
    pendingPlaceId,
  } = useModPlaceBookmarkBatch(placeIds);

  const places = useMemo(
    () =>
      items.map((item) => {
        const summary = {
          id: item.place.id,
          slug: item.place.slug,
          name: item.place.name,
          address: item.place.address,
          city: item.place.city,
          placeType: item.place.placeType as "CURATED" | "RESERVABLE",
          featuredRank: item.place.featuredRank,
          provinceRank: item.place.provinceRank,
        };
        return buildDiscoveryPlaceCard(
          summary,
          mediaById[item.placeId],
          metaById[item.placeId],
        );
      }),
    [items, mediaById, metaById],
  );

  const hasMore = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="mb-6 h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((id) => (
            <PlaceCardSkeleton key={id} />
          ))}
        </div>
      </Container>
    );
  }

  if (items.length === 0 && offset === 0) {
    return (
      <Container className="py-8">
        <Empty className="py-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Heart />
            </EmptyMedia>
            <EmptyTitle>No saved venues yet</EmptyTitle>
            <EmptyDescription>
              Browse courts and tap the heart icon to save venues you like for
              quick access later.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={appRoutes.courts.base}>Browse Courts</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-heading text-2xl font-bold">Saved Venues</h1>
        <span className="text-sm text-muted-foreground">
          {total} venue{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isMediaLoading={isMediaLoading}
            isMetaLoading={isMetaLoading}
            isBookmarked={bookmarkedSet.has(place.id)}
            isBookmarkPending={isBookmarkPending && pendingPlaceId === place.id}
            onBookmarkToggle={() => toggleBookmark(place.id)}
          />
        ))}
      </div>

      {(hasPrev || hasMore) && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
}
