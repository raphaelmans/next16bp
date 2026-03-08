import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  RatingHistogram,
  ReviewCard,
  type ReviewItem,
  StarRatingDisplay,
} from "@/features/discovery/place-detail/components/review-display";

const REVIEWS_PER_PAGE = 10;

type PlaceReviewsPageContentProps = {
  placeName: string;
  placeSlug: string;
  reviews: ReviewItem[];
  total: number;
  currentPage: number;
  aggregate: {
    averageRating: number;
    reviewCount: number;
    histogram: Record<number, number>;
  };
};

function buildPageUrl(placeSlug: string, page: number) {
  const base = appRoutes.places.reviews(placeSlug);
  return page <= 1 ? base : `${base}?page=${page}`;
}

function getPaginationRange(currentPage: number, totalPages: number) {
  const delta = 1;
  const range: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  range.push(1);

  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  if (start > 2) {
    range.push("ellipsis-start");
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (end < totalPages - 1) {
    range.push("ellipsis-end");
  }

  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}

export function PlaceReviewsPageContent({
  placeName,
  placeSlug,
  reviews,
  total,
  currentPage,
  aggregate,
}: PlaceReviewsPageContentProps) {
  const totalPages = Math.ceil(total / REVIEWS_PER_PAGE);
  const paginationRange = getPaginationRange(currentPage, totalPages);

  return (
    <Container className="py-6 space-y-6">
      <Link
        href={appRoutes.places.detail(placeSlug)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {placeName}
      </Link>

      <div>
        <h1 className="text-xl font-heading font-bold">
          Reviews for {placeName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {aggregate.reviewCount}{" "}
          {aggregate.reviewCount === 1 ? "review" : "reviews"}
        </p>
      </div>

      {/* Aggregate summary */}
      <div className="grid gap-6 sm:grid-cols-2 border rounded-lg p-4">
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

      {/* Review list */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-b-0">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageUrl(placeSlug, currentPage - 1)}
                />
              </PaginationItem>
            )}

            {paginationRange.map((item) =>
              typeof item === "string" ? (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={buildPageUrl(placeSlug, item)}
                    isActive={item === currentPage}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={buildPageUrl(placeSlug, currentPage + 1)}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </Container>
  );
}
