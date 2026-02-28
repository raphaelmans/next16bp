"use client";

import type * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useModExternalOpenPlaysByPlace,
  useModOpenPlaysByPlace,
} from "../hooks";
import { ExternalBookingInfoCard } from "./external-booking-info-card";
import { ExternalOpenPlayList } from "./external-open-play-list";
import { OpenPlayList } from "./open-play-list";

export function OpenPlayVenuePanel({
  place,
  hostCta,
  externalHostCta,
}: {
  place: {
    id: string;
    timeZone: string;
  };
  hostCta: React.ReactNode;
  externalHostCta?: React.ReactNode;
}) {
  const query = useModOpenPlaysByPlace({
    placeId: place.id,
    limit: 20,
    enabled: Boolean(place.id),
  });
  const externalQuery = useModExternalOpenPlaysByPlace({
    placeId: place.id,
    limit: 20,
    enabled: Boolean(place.id),
  });

  if (query.isLoading || externalQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-destructive">
          {query.error.message}
        </CardContent>
      </Card>
    );
  }
  if (externalQuery.isError) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-destructive">
          {externalQuery.error.message}
        </CardContent>
      </Card>
    );
  }

  const items = query.data ?? [];
  const externalItems = externalQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="font-heading font-semibold">
                  No Open Plays yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to host an Open Play at this venue.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <OpenPlayList
            items={items}
            timeZone={place.timeZone}
            hrefFor={(id) => appRoutes.openPlay.detail(id)}
          />
        )}
      </section>

      <section className="space-y-4">
        {externalItems.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="font-heading font-semibold">
                  No external sessions
                </h3>
                <p className="text-sm text-muted-foreground">
                  External Open Plays are unverified and shown separately.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ExternalOpenPlayList
            items={externalItems}
            timeZone={place.timeZone}
            hrefFor={(id) => appRoutes.openPlay.externalDetail(id)}
          />
        )}
      </section>

      <div className="space-y-3">
        <ExternalBookingInfoCard cta={hostCta} />
        {externalHostCta ? (
          <div className="rounded-md border bg-muted/20 p-3">
            {externalHostCta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
