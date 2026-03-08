import { PlaceCardSkeleton } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourtsCitySportLoading() {
  return (
    <>
      {/* Sport header skeleton */}
      <section className="border-b border-border bg-card/50 py-5">
        <Container className="space-y-3">
          <Skeleton className="h-4 w-72" />

          {/* Navigation links */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          {/* Popular venues */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-28 rounded-full" />
              ))}
            </div>
          </div>

          {/* Other sports */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Courts list skeleton */}
      <Container>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-[120px] rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
