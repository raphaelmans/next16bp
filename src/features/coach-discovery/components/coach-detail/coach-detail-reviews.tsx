"use client";

import { Star, Trash2 } from "lucide-react";
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
  buildCoachReviewAggregateInitialData,
  type CoachReviewListResult,
  useMutCoachDetailRemoveReview,
  useMutCoachDetailUpsertReview,
  useQueryCoachDetailReviewAggregate,
  useQueryCoachDetailReviews,
  useQueryCoachDetailViewerEligibility,
  useQueryCoachDetailViewerReview,
} from "@/features/coach-discovery/hooks/use-coach-detail-reviews";
import {
  RatingHistogram,
  ReviewCard,
  StarRatingDisplay,
} from "@/features/discovery/place-detail/components/review-display";
import { cn } from "@/lib/utils";

interface CoachDetailReviewsSectionProps {
  coachId: string;
  initialAggregate?: {
    averageRating: number | null;
    reviewCount: number;
  } | null;
  initialReviews?: CoachReviewListResult;
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
                ? "fill-warning text-warning"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

const getEligibilityCopy = (
  reason?: "NO_PROFILE" | "NO_COMPLETED_SESSION" | null,
) => {
  if (reason === "NO_PROFILE") {
    return "Complete your player profile and finish a confirmed session before leaving a review.";
  }

  return "Only players with a completed confirmed session can review this coach.";
};

export function CoachDetailReviewsSection({
  coachId,
  initialAggregate,
  initialReviews,
}: CoachDetailReviewsSectionProps) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = Boolean(session);
  const router = useRouter();
  const pathname = usePathname();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const aggregateQuery = useQueryCoachDetailReviewAggregate(coachId, {
    initialData: buildCoachReviewAggregateInitialData(initialAggregate),
    staleTime: 30_000,
  });
  const reviewsQuery = useQueryCoachDetailReviews({
    coachId,
    limit: 5,
    offset: 0,
    initialData: initialReviews,
  });
  const viewerReviewQuery = useQueryCoachDetailViewerReview(coachId, {
    enabled: isAuthenticated,
  });
  const viewerEligibilityQuery = useQueryCoachDetailViewerEligibility(coachId, {
    enabled: isAuthenticated,
  });

  const upsertMutation = useMutCoachDetailUpsertReview(coachId, {
    isAuthenticated,
    onSuccess: async () => {
      setIsEditing(false);
      router.refresh();
    },
  });
  const removeMutation = useMutCoachDetailRemoveReview(coachId, {
    isAuthenticated,
    onSuccess: async () => {
      setRating(0);
      setBody("");
      setIsEditing(false);
      router.refresh();
    },
  });

  const handleStartReview = useCallback(() => {
    if (!isAuthenticated) {
      router.push(appRoutes.login.from(pathname));
      return;
    }

    const existing = viewerReviewQuery.data;
    if (!existing && !viewerEligibilityQuery.data?.canReview) {
      return;
    }

    if (existing) {
      setRating(existing.rating);
      setBody(existing.body ?? "");
    }
    setIsEditing(true);
  }, [
    isAuthenticated,
    pathname,
    router,
    viewerEligibilityQuery.data?.canReview,
    viewerReviewQuery.data,
  ]);

  const handleSubmit = useCallback(() => {
    if (rating < 1 || rating > 5) return;
    upsertMutation.mutate({
      coachId,
      rating,
      body: body.trim() || undefined,
    });
  }, [body, coachId, rating, upsertMutation]);

  const handleRemove = useCallback(
    (reviewId: string) => {
      removeMutation.mutate({ reviewId });
    },
    [removeMutation],
  );

  const aggregate = aggregateQuery.data;
  const reviews = reviewsQuery.data;
  const viewerReview = viewerReviewQuery.data;
  const viewerEligibility = viewerEligibilityQuery.data;
  const hasReviews = (aggregate?.reviewCount ?? 0) > 0;

  return (
    <Card id="reviews" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base font-heading">Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregateQuery.isLoading && !aggregate ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : hasReviews && aggregate ? (
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
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              No reviews yet. Completed players can be the first to share their
              session experience.
            </p>
          </div>
        )}

        <Separator />

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
              placeholder="Share what the session was like (optional)"
              value={body}
              onChange={(event) => setBody(event.target.value)}
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
        ) : viewerReview ? (
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
            {viewerReview.body ? (
              <p className="text-sm text-muted-foreground">
                {viewerReview.body}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleStartReview}
              disabled={isAuthenticated && viewerEligibilityQuery.isLoading}
            >
              {isAuthenticated ? "Write a review" : "Sign in to write a review"}
            </Button>
            {isAuthenticated &&
            viewerEligibility &&
            !viewerEligibility.canReview ? (
              <p className="text-sm text-muted-foreground">
                {getEligibilityCopy(viewerEligibility.reason)}
              </p>
            ) : null}
          </div>
        )}

        {reviewsQuery.isLoading && !reviews ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
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
      </CardContent>
    </Card>
  );
}
