import { Skeleton } from "@/components/ui/skeleton";

export default function CourtDetailLoading() {
  return (
    <div className="min-h-[60vh] py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Image gallery skeleton */}
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-16 w-16 rounded-lg" />
            </div>

            {/* Title and info skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Amenities skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>

          {/* Booking card skeleton */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border p-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-4 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
