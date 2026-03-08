import { PlaceCardSkeleton } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourtsLoading() {
  return (
    <Container>
      <div className="space-y-4">
        {/* Header: title + result count | filter button + view toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[120px] rounded-lg" />
          </div>
        </div>

        {/* Place cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
