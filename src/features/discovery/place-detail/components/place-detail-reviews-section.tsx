"use client";

import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryAuthSession } from "@/features/auth/hooks";
import {
  RatingHistogram,
  ReviewCard,
  StarRatingDisplay,
} from "@/features/discovery/place-detail/components/review-display";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface PlaceDetailReviewsSectionProps {
  placeId: string;
  placeSlug: string;
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function PlaceDetailReviewsSection({
  placeId,
  placeSlug,
}: PlaceDetailReviewsSectionProps) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = Boolean(session);
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const aggregateQuery = trpc.placeReview.aggregate.useQuery({ placeId });
  const reviewsQuery = trpc.placeReview.list.useQuery({
    placeId,
    limit: 5,
    offset: 0,
  });
  const viewerReviewQuery = trpc.placeReview.viewerReview.useQuery(
    { placeId },
    { enabled: isAuthenticated },
  );

  const upsertMutation = trpc.placeReview.upsert.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void utils.placeReview.aggregate.invalidate({ placeId });
      void utils.placeReview.list.invalidate({ placeId });
      void utils.placeReview.viewerReview.invalidate({ placeId });
    },
  });

  const removeMutation = trpc.placeReview.remove.useMutation({
    onSuccess: () => {
      setRating(0);
      setBody("");
      setIsEditing(false);
      void utils.placeReview.aggregate.invalidate({ placeId });
      void utils.placeReview.list.invalidate({ placeId });
      void utils.placeReview.viewerReview.invalidate({ placeId });
    },
  });

  const handleStartReview = useCallback(() => {
    if (!isAuthenticated) {
      router.push(appRoutes.login.from(pathname));
      return;
    }
    const existing = viewerReviewQuery.data;
    if (existing) {
      setRating(existing.rating);
      setBody(existing.body ?? "");
    }
    setIsEditing(true);
  }, [isAuthenticated, router, pathname, viewerReviewQuery.data]);

  const handleSubmit = useCallback(() => {
    if (rating < 1 || rating > 5) return;
    upsertMutation.mutate({
      placeId,
      rating,
      body: body.trim() || undefined,
    });
  }, [rating, body, placeId, upsertMutation]);

  const handleRemove = useCallback(
    (reviewId: string) => {
      removeMutation.mutate({ reviewId });
    },
    [removeMutation],
  );

  const aggregate = aggregateQuery.data;
  const reviews = reviewsQuery.data;
  const viewerReview = viewerReviewQuery.data;
  const hasReviews = aggregate && aggregate.reviewCount > 0;
  const totalReviews = aggregate?.reviewCount ?? 0;

  return (
    <Card id="reviews" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base font-heading">Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregateQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : hasReviews ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-heading font-bold">
                {aggregate.averageRating.toFixed(1)}
              </span>
              <StarRatingDisplay rating={Math.round(aggregate.averageRating)} />
              <span className="text-sm text-muted-foreground">
                {aggregate.reviewCount}{" "}
                {aggregate.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>
            <RatingHistogram
              histogram={aggregate.histogram}
              total={aggregate.reviewCount}
            />
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your experience.
            </p>
          </div>
        )}

        <Separator />

        {/* Write/Edit review */}
        {isEditing ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {viewerReview ? "Edit your review" : "Write a review"}
            </p>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={upsertMutation.isPending}
            />
            <Textarea
              placeholder="Share your experience (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={upsertMutation.isPending}
              className="resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={rating < 1 || upsertMutation.isPending}
              >
                {upsertMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : viewerReview ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={upsertMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {viewerReview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay rating={viewerReview.rating} size="xs" />
                    <span className="text-xs text-muted-foreground">
                      Your review
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={handleStartReview}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemove(viewerReview.id)}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                {viewerReview.body && (
                  <p className="text-sm text-muted-foreground">
                    {viewerReview.body}
                  </p>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleStartReview}
              >
                Write a review
              </Button>
            )}
          </div>
        )}

        {/* Review list */}
        {reviewsQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : reviews && reviews.items.length > 0 ? (
          <div className="space-y-4">
            {reviews.items
              .filter((review) => review.id !== viewerReview?.id)
              .map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
          </div>
        ) : null}

        {/* See all reviews link */}
        {totalReviews > 5 && (
          <Link
            href={appRoutes.places.reviews(placeSlug)}
            className="block text-center text-sm font-medium text-primary hover:underline"
          >
            See all {totalReviews} reviews
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
