"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useModPlaceDetail } from "@/features/discovery/hooks";
import {
  useModExternalOpenPlaysByPlace,
  useModOpenPlaysByPlace,
} from "../hooks";
import { ExternalBookingInfoCard } from "./external-booking-info-card";
import { ExternalOpenPlayCreateDialog } from "./external-open-play-create-dialog";
import { ExternalOpenPlayList } from "./external-open-play-list";
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
  const externalListQuery = useModExternalOpenPlaysByPlace({
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

  const hostCtaHref = `${appRoutes.places.book(place.slug ?? place.id)}?openPlay=1&source=reclub`;

  return (
    <Container className="py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Open Plays</h1>
          <p className="text-sm text-muted-foreground">{place.name}</p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link href={appRoutes.places.detail(place.slug ?? place.id)}>
              Back to venue
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <ExternalBookingInfoCard
          cta={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={hostCtaHref}>Book in KudosCourts</Link>
              </Button>
              <ExternalOpenPlayCreateDialog
                place={{
                  id: place.id,
                  sports: place.sports.map((sport) => ({
                    id: sport.id,
                    name: sport.name,
                  })),
                }}
              />
            </div>
          }
        />
      </div>

      <div className="mt-6 space-y-8">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            Verified Open Plays
          </h2>
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
                    No verified sessions yet.
                  </p>
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
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            External Open Plays (Unverified)
          </h2>
          {externalListQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : externalListQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-destructive">
                {externalListQuery.error.message}
              </CardContent>
            </Card>
          ) : (externalListQuery.data?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <h3 className="font-heading font-semibold">
                    No external sessions yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Host an external session if your booking was made outside
                    KudosCourts.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ExternalOpenPlayList
              items={externalListQuery.data ?? []}
              timeZone={place.timeZone}
              hrefFor={(id) => appRoutes.openPlay.externalDetail(id)}
            />
          )}
        </section>
      </div>
    </Container>
  );
}
