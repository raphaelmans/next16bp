"use client";

import { Clock3, Sparkles } from "lucide-react";
import {
  formatDateShortInTimeZone,
  formatTimeInTimeZone,
} from "@/common/format";
import { PlaceCard, type PlaceCardPlace } from "@/components/kudos";
import { Card } from "@/components/ui/card";
import type { DiscoveryAvailabilityPreview } from "@/features/discovery/query-options";
import { cn } from "@/lib/utils";

interface DiscoveryPlaceCardProps {
  place: PlaceCardPlace;
  availabilityPreview?: DiscoveryAvailabilityPreview;
  isMediaLoading?: boolean;
  isMetaLoading?: boolean;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  onBookmarkToggle?: () => void;
  className?: string;
}

export function DiscoveryPlaceCard({
  place,
  availabilityPreview,
  isMediaLoading,
  isMetaLoading,
  isBookmarked,
  isBookmarkPending,
  onBookmarkToggle,
  className,
}: DiscoveryPlaceCardProps) {
  if (!availabilityPreview) {
    return (
      <PlaceCard
        place={place}
        isMediaLoading={isMediaLoading}
        isMetaLoading={isMetaLoading}
        isBookmarked={isBookmarked}
        isBookmarkPending={isBookmarkPending}
        onBookmarkToggle={onBookmarkToggle}
        className={className}
      />
    );
  }

  const requestedDateLabel = formatDateShortInTimeZone(
    `${availabilityPreview.requestedDate}T12:00:00+08:00`,
    availabilityPreview.timeZone,
  );
  const matchedTimeLabel = formatTimeInTimeZone(
    availabilityPreview.matchedStartTime,
    availabilityPreview.timeZone,
  );
  const requestedTimes = availabilityPreview.requestedTime;
  const exactTimeLabel =
    requestedTimes && requestedTimes.length === 1
      ? formatTimeInTimeZone(
          `${availabilityPreview.requestedDate}T${requestedTimes[0]}:00+08:00`,
          availabilityPreview.timeZone,
        )
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <PlaceCard
        place={place}
        isMediaLoading={isMediaLoading}
        isMetaLoading={isMetaLoading}
        isBookmarked={isBookmarked}
        isBookmarkPending={isBookmarkPending}
        onBookmarkToggle={onBookmarkToggle}
      />
      <Card className="border-primary/15 bg-primary/5 px-4 py-3 shadow-none">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-primary/12 p-2 text-primary">
            {exactTimeLabel ? (
              <Clock3 className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {exactTimeLabel
                ? `Available at ${exactTimeLabel}`
                : `Available on ${requestedDateLabel}`}
              {availabilityPreview.sportName && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {availabilityPreview.sportName}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {`${availabilityPreview.matchCount} matching ${availabilityPreview.matchCount === 1 ? "slot" : "slots"} ${exactTimeLabel ? `starting at ${matchedTimeLabel}` : `with the earliest at ${matchedTimeLabel}`}.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
