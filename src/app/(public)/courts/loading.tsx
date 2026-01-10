import { Skeleton } from "@/components/ui/skeleton";

function CourtCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="pt-3 border-t flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function CourtsLoading() {
  return (
    <div className="min-h-[60vh] py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Search and filters skeleton */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Court cards grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CourtCardSkeleton />
          <CourtCardSkeleton />
          <CourtCardSkeleton />
          <CourtCardSkeleton />
          <CourtCardSkeleton />
          <CourtCardSkeleton />
        </div>
      </div>
    </div>
  );
}
