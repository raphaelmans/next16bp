"use client";

import { Spinner } from "@/components/ui/spinner";

export function OwnerCourtAvailabilityLoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}
