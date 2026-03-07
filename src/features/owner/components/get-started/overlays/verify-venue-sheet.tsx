"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlaceVerificationPanel } from "@/features/owner/components/place-verification-panel";

interface VerifyVenueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId?: string;
  placeName: string;
  onSuccess: () => void;
}

export function VerifyVenueSheet({
  open,
  onOpenChange,
  placeId,
  placeName,
  onSuccess,
}: VerifyVenueSheetProps) {
  if (!placeId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Verify {placeName}</SheetTitle>
          <SheetDescription>
            Upload proof of ownership to improve your venue status and add a
            verified badge.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <PlaceVerificationPanel
            placeId={placeId}
            placeName={placeName}
            reservationCapable
            onSuccess={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
