import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityTimelineSkeleton() {
  return (
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
  );
}
