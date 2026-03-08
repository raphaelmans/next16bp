import { PlaceCardSkeleton } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourtsCityLoading() {
  return (
    <>
      {/* City breadcrumb header skeleton */}
      <section className="border-b border-border bg-card/50 py-5">
        <Container>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Skeleton className="h-4 w-20" />
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
            <span aria-hidden="true" className="mx-1 h-3 w-px bg-border" />
            {Array.from({ length: 3 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={`v-${i}`} className="h-6 w-28 rounded-full" />
            ))}
          </div>
        </Container>
      </section>

      {/* Courts list skeleton */}
      <Container className="pt-6">
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
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
