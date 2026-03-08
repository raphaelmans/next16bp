"use client";

import { Star } from "lucide-react";
import { usePlaceDetailReviewAggregateContext } from "@/features/discovery/place-detail/components/place-detail-review-aggregate-provider";
import { cn } from "@/lib/utils";

export function PlaceDetailHeroReviewSummary() {
  const { aggregate } = usePlaceDetailReviewAggregateContext();
  const reviewAggregate =
    aggregate && aggregate.reviewCount > 0 ? aggregate : null;

  return (
    <a
      href="#reviews"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {reviewAggregate ? (
        <>
          <span className="font-medium text-foreground">
            {reviewAggregate.averageRating.toFixed(1)}
          </span>
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3 w-3",
                  star <= Math.round(reviewAggregate.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/20",
                )}
              />
            ))}
          </div>
          <span className="text-xs">({reviewAggregate.reviewCount})</span>
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
