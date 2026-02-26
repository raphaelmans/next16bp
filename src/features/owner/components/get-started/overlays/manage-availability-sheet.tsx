"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AvailabilityCoordinatorContent } from "@/features/owner/components/place-court-availability/place-court-availability-coordinator";

interface ManageAvailabilitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId?: string;
  courtId?: string;
}

export function ManageAvailabilitySheet({
  open,
  onOpenChange,
  placeId,
  courtId,
}: ManageAvailabilitySheetProps) {
  if (!placeId || !courtId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-4xl"
      >
        <SheetHeader>
          <SheetTitle>Manage Availability</SheetTitle>
          <SheetDescription>
            View and manage court availability, blocks, and bookings.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <AvailabilityCoordinatorContent placeId={placeId} courtId={courtId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
