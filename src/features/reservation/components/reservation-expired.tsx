"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReservationExpiredProps {
  placeId?: string;
  courtName?: string;
  slotDate?: string;
  slotTime?: string;
  amount?: string;
}

export function ReservationExpired({
  placeId,
  courtName,
  slotDate,
  slotTime,
  amount,
}: ReservationExpiredProps) {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>

          <h2 className="mb-2 font-heading text-lg font-semibold">
            Reservation Expired
          </h2>

          <p className="mb-6 text-muted-foreground">
            The 15-minute payment window has passed and this reservation is no
            longer valid.
          </p>

          {(courtName || slotDate) && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4 text-left">
              <p className="mb-2 text-sm font-medium">Your Requested Slot</p>
              {courtName && (
                <p className="text-sm text-muted-foreground">
                  Court: {courtName}
                </p>
              )}
              {slotDate && (
                <p className="text-sm text-muted-foreground">
                  Date: {slotDate}
                </p>
              )}
              {slotTime && (
                <p className="text-sm text-muted-foreground">
                  Time: {slotTime}
                </p>
              )}
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Amount: {amount}
                </p>
              )}
            </div>
          )}

          <p className="mb-4 text-sm text-muted-foreground">
            The slot is now available for others to book.
          </p>

          {placeId && (
            <Button asChild>
              <Link href={appRoutes.places.detail(placeId)}>Book Again</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
