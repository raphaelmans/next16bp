"use client";

import { Star } from "lucide-react";
import {
  buildPlaceReviewAggregateInitialData,
  type PlaceReviewAggregateSummary,
  useQueryPlaceDetailReviewAggregate,
} from "@/features/discovery/place-detail/hooks/use-place-detail-reviews";
import { cn } from "@/lib/utils";

type PlaceDetailHeroReviewSummaryProps = {
  placeId: string;
  initialReviewAggregate: PlaceReviewAggregateSummary | null;
};

export function PlaceDetailHeroReviewSummary({
  placeId,
  initialReviewAggregate,
}: PlaceDetailHeroReviewSummaryProps) {
  const aggregateQuery = useQueryPlaceDetailReviewAggregate(placeId, {
    initialData: buildPlaceReviewAggregateInitialData(initialReviewAggregate),
  });
  const aggregate = aggregateQuery.data;
  const hasReviews = Boolean(aggregate && aggregate.reviewCount > 0);

  return (
    <a
      href="#reviews"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {hasReviews ? (
        <>
          <span className="font-medium text-foreground">
            {aggregate.averageRating.toFixed(1)}
          </span>
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3 w-3",
                  star <= Math.round(aggregate.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/20",
                )}
              />
            ))}
          </div>
          <span className="text-xs">({aggregate.reviewCount})</span>
        </>
      ) : (
        <>
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3 w-3 text-muted-foreground/20" />
            ))}
          </div>
          <span className="text-xs">No reviews</span>
        </>
      )}
    </a>
  );
}
