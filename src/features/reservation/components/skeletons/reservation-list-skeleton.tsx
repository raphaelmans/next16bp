import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReservationListSkeleton() {
  return (
    <div className="space-y-4">
      {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
        <ReservationListItemSkeleton key={id} />
      ))}
    </div>
  );
}

export function ReservationListItemSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Image skeleton */}
        <Skeleton className="h-20 w-20 rounded-lg shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </Card>
  );
}
