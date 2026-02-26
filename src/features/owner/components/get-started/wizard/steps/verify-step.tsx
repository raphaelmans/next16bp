"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceVerificationPanel } from "@/features/owner/components/place-verification-panel";
import type { SetupStatus } from "../../get-started-types";

interface VerifyStepProps {
  status: SetupStatus;
  onStepComplete: () => void;
}

export function VerifyStep({ status, onStepComplete }: VerifyStepProps) {
  if (status.isVenueVerified) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Venue verified</p>
            <p className="text-sm text-muted-foreground">
              {status.primaryPlaceName} is verified and ready for bookings.
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!status.primaryPlaceId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Add a venue first to submit verification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PlaceVerificationPanel
      placeId={status.primaryPlaceId}
      placeName={status.primaryPlaceName}
      reservationCapable
      onSuccess={onStepComplete}
    />
  );
}
