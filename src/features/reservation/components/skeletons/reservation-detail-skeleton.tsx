import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReservationDetailSkeleton() {
  return (
    <div className="min-w-0 space-y-6">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Status banner skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Booking details card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-w-0 gap-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 max-w-40" />
                  <Skeleton className="h-4 w-2/3 max-w-32" />
                  <Skeleton className="h-4 w-full max-w-48" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization info card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="flex min-w-0 items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3 max-w-32" />
                  <Skeleton className="h-4 w-full max-w-40" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {["timeline-1", "timeline-2", "timeline-3"].map((id) => (
                <div key={id} className="flex min-w-0 gap-4">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-2/3 max-w-32" />
                    <Skeleton className="h-3 w-1/2 max-w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-2/3 max-w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full max-w-40" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
