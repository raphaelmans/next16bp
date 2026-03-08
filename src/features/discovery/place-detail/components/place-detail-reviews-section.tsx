"use client";

import { Star, Trash2, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryAuthSession } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface PlaceDetailReviewsSectionProps {
  placeId: string;
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

function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "xs";
}) {
  const starSize = size === "sm" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/20",
          )}
        />
      ))}
    </div>
  );
}

function RatingHistogram({
  histogram,
  total,
}: {
  histogram: Record<number, number>;
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = histogram[star] ?? 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-muted-foreground">{star}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function PlaceDetailReviewsSection({
  placeId,
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
    limit: 10,
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

  return (
    <Card id="reviews" className="scroll-mt-4">
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
                <div key={review.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={review.authorAvatarUrl ?? undefined} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {review.authorDisplayName ?? "Player"}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatRelativeDate(review.createdAt)}
                        </span>
                      </div>
                      <StarRatingDisplay rating={review.rating} size="xs" />
                    </div>
                  </div>
                  {review.body && (
                    <p className="text-sm text-muted-foreground pl-9">
                      {review.body}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
