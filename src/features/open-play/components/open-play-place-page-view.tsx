"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useModPlaceDetail } from "@/features/discovery/hooks";
import { useModOpenPlaysByPlace } from "../hooks";
import { OpenPlayList } from "./open-play-list";

type OpenPlayPlacePageViewProps = {
  placeIdOrSlug: string;
};

export default function OpenPlayPlacePageView({
  placeIdOrSlug,
}: OpenPlayPlacePageViewProps) {
  const placeQuery = useModPlaceDetail({ placeIdOrSlug });
  const place = placeQuery.data;

  const listQuery = useModOpenPlaysByPlace({
    placeId: place?.id ?? "",
    enabled: Boolean(place?.id),
    limit: 50,
  });

  if (placeQuery.isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-24 w-full" />
      </Container>
    );
  }

  if (!place) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Venue not found.
          </CardContent>
        </Card>
      </Container>
    );
  }

  const hostCtaHref = `${appRoutes.places.book(place.slug ?? place.id)}?openPlay=1`;

  return (
    <Container className="py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Open Plays</h1>
          <p className="text-sm text-muted-foreground">{place.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={appRoutes.places.detail(place.slug ?? place.id)}>
              Back to venue
            </Link>
          </Button>
          <Button asChild>
            <Link href={hostCtaHref}>Host</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {listQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : listQuery.isError ? (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive">
              {listQuery.error.message}
            </CardContent>
          </Card>
        ) : (listQuery.data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="font-heading font-semibold">
                  No upcoming Open Plays
                </h3>
                <p className="text-sm text-muted-foreground">
                  Host one to invite other players.
                </p>
              </div>
              <div className="mt-4">
                <Button asChild>
                  <Link href={hostCtaHref}>Host an Open Play</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <OpenPlayList
            items={listQuery.data ?? []}
            timeZone={place.timeZone}
            hrefFor={(id) => appRoutes.openPlay.detail(id)}
          />
        )}
      </div>
    </Container>
  );
}
