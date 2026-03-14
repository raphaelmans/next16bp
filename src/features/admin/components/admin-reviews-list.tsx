"use client";

import { Star, Trash2, User } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function AdminReviewsList() {
  const [status, setStatus] = useState<"active" | "removed" | undefined>(
    undefined,
  );
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(
    undefined,
  );
  const [page, setPage] = useState(0);
  const limit = 20;

  const reviewsQuery = trpc.admin.placeReview.list.useQuery({
    status,
    rating: ratingFilter,
    limit,
    offset: page * limit,
  });

  const utils = trpc.useUtils();
  const [removalReason, setRemovalReason] = useState("");

  const removeMutation = trpc.admin.placeReview.remove.useMutation({
    onSuccess: () => {
      setRemovalReason("");
      void utils.admin.placeReview.list.invalidate();
    },
  });

  const reviews = reviewsQuery.data;
  const total = reviews?.total ?? 0;
  const hasMore = (page + 1) * limit < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Review Moderation</h1>
        <p className="text-sm text-muted-foreground">
          View and moderate venue reviews
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={status ?? "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : (v as "active" | "removed"));
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={ratingFilter?.toString() ?? "all"}
          onValueChange={(v) => {
            setRatingFilter(v === "all" ? undefined : Number(v));
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={r.toString()}>
                {r} star{r > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reviewsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews && reviews.items.length > 0 ? (
        <div className="space-y-3">
          {reviews.items.map((review) => (
            <Card
              key={review.id}
              className={cn(review.removedAt && "opacity-60")}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.authorAvatarUrl ?? undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {review.authorDisplayName ?? "Unknown"}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= review.rating
                                ? "fill-warning text-warning"
                                : "text-muted-foreground/20",
                            )}
                          />
                        ))}
                      </div>
                      {review.removedAt ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Removed
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    {review.body && (
                      <p className="text-sm text-muted-foreground">
                        {review.body}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Place: {review.placeId.slice(0, 8)}...</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.removedAt && review.removalReason && (
                      <p className="text-xs text-destructive">
                        Removal reason: {review.removalReason}
                      </p>
                    )}
                  </div>
                  {!review.removedAt && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove review</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the review from public display. The
                            review will remain in the moderation history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          placeholder="Reason for removal (optional)"
                          value={removalReason}
                          onChange={(e) => setRemovalReason(e.target.value)}
                          rows={2}
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setRemovalReason("")}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={removeMutation.isPending}
                            onClick={() =>
                              removeMutation.mutate({
                                reviewId: review.id,
                                reason: removalReason.trim() || undefined,
                              })
                            }
                          >
                            {removeMutation.isPending ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Remove"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No reviews found
          </CardContent>
        </Card>
      )}

      {total > limit && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of{" "}
            {total}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
