"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationStatusBanner } from "@/features/discovery/components/verification-status-banner";
import type { PlaceVerificationStatusVariant } from "@/features/discovery/helpers";

type CourtItem = {
  id: string;
  label: string;
  sportName: string;
  tierLabel?: string;
  isActive: boolean;
};

type PlaceDetailCourtsCardProps = {
  showBookingVerificationUi: boolean;
  verificationMessage: string;
  verificationDescription: string;
  verificationStatusVariant: PlaceVerificationStatusVariant;
  courts: CourtItem[];
};

export function PlaceDetailCourtsCard({
  showBookingVerificationUi,
  verificationMessage,
  verificationDescription,
  verificationStatusVariant,
  courts,
}: PlaceDetailCourtsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Courts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showBookingVerificationUi && (
          <VerificationStatusBanner
            message={verificationMessage}
            description={verificationDescription}
            variant={verificationStatusVariant}
          />
        )}
        {courts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Court inventory has not been added yet.
          </p>
        ) : (
          courts.map((court) => (
            <div
              key={court.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <div className="space-y-1">
                <div className="font-medium">{court.label}</div>
                <div className="text-sm text-muted-foreground">
                  {court.sportName}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {court.sportName}
                </Badge>
                {court.tierLabel && (
                  <Badge variant="secondary" className="text-[10px]">
                    {court.tierLabel}
                  </Badge>
                )}
                {!court.isActive && (
                  <Badge variant="destructive" className="text-[10px]">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
