"use client";

import { toast } from "@/common/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CourtsEmptyState } from "@/features/owner/components/courts-empty-state";
import { CourtsTable } from "@/features/owner/components/courts-table";
import {
  useMutDeactivateCourt,
  useQueryOwnerCourtsByPlace,
} from "@/features/owner/hooks";

interface CourtsListManagerProps {
  placeId: string;
}

export function CourtsListManager({ placeId }: CourtsListManagerProps) {
  const { data: courts = [], isLoading: courtsLoading } =
    useQueryOwnerCourtsByPlace(placeId);
  const deactivateMutation = useMutDeactivateCourt();

  const handleDeactivate = (courtId: string) => {
    deactivateMutation.mutate(
      { courtId },
      {
        onSuccess: () => toast.success("Venue deactivated successfully"),
        onError: () => toast.error("Failed to deactivate venue"),
      },
    );
  };

  if (courtsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (courts.length === 0) {
    return <CourtsEmptyState />;
  }

  return <CourtsTable courts={courts} onDeactivate={handleDeactivate} />;
}
