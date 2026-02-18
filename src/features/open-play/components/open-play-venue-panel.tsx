"use client";

import type * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useModOpenPlaysByPlace } from "../hooks";
import { OpenPlayList } from "./open-play-list";

export function OpenPlayVenuePanel({
  place,
  hostCta,
}: {
  place: {
    id: string;
    timeZone: string;
  };
  hostCta: React.ReactNode;
}) {
  const query = useModOpenPlaysByPlace({
    placeId: place.id,
    limit: 20,
    enabled: Boolean(place.id),
  });

  if (query.isLoading) {
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

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="font-heading font-semibold">No Open Plays yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to host an Open Play at this venue.
            </p>
          </div>
          <div className="mt-4">{hostCta}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <OpenPlayList
        items={items}
        timeZone={place.timeZone}
        hrefFor={(id) => appRoutes.openPlay.detail(id)}
      />
      <div>{hostCta}</div>
    </div>
  );
}
