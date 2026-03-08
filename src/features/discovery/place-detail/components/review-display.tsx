import { Star, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
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

export function RatingHistogram({
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

export function formatRelativeDate(date: Date | string): string {
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

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date | string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
};

export function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="space-y-1.5">
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
        <p className="text-sm text-muted-foreground pl-9">{review.body}</p>
      )}
    </div>
  );
}
