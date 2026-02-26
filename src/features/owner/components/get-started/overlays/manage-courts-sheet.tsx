"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CourtsListManager } from "@/features/owner/components/courts-list-manager";

interface ManageCourtsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId?: string;
}

export function ManageCourtsSheet({
  open,
  onOpenChange,
  placeId,
}: ManageCourtsSheetProps) {
  if (!placeId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Manage Courts</SheetTitle>
          <SheetDescription>
            View and manage your venue courts.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CourtsListManager placeId={placeId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
