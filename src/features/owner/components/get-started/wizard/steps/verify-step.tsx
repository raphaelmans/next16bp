"use client";

import { CheckCircle2, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
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

  const isPending = status.verificationStatus === "PENDING";

  if (isPending) {
    return (
      <div className="space-y-4">
        <PlaceVerificationPanel
          placeId={status.primaryPlaceId}
          placeName={status.primaryPlaceName}
          reservationCapable
          onSuccess={onStepComplete}
        />
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h4 className="font-heading font-semibold">
              Continue setting up while you wait
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Verification usually takes 1–2 business days. In the meantime, you
              can add more courts to your venue.
            </p>
            <Button asChild className="mt-4">
              <Link
                href={`${appRoutes.organization.places.courts.base(status.primaryPlaceId)}?from=setup`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add more courts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
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
