"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlaceDetailAvailabilityStudioProps } from "./place-detail-availability-studio";

const DynamicPlaceDetailAvailabilityStudio = dynamic(
  () =>
    import("./place-detail-availability-studio").then((module) => ({
      default: module.PlaceDetailAvailabilityStudio,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    ),
  },
);

export function PlaceDetailAvailabilityStudioSlot(
  props: PlaceDetailAvailabilityStudioProps,
) {
  return <DynamicPlaceDetailAvailabilityStudio {...props} />;
}
