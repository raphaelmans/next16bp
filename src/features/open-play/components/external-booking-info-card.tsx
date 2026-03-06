"use client";

import { AlertTriangle } from "lucide-react";
import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExternalBookingInfoCardProps {
  cta?: React.ReactNode;
  className?: string;
}

export function ExternalBookingInfoCard({
  cta,
  className,
}: ExternalBookingInfoCardProps) {
  return (
    <Card className={cn("border-warning/20 bg-warning/5", className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-semibold text-warning-foreground">
              Booked in Reclub?
            </h3>
            <p className="text-sm text-warning-foreground">
              You can still host as an External Open Play (unverified) if your
              booking was made outside KudosCourts. For a verified Open Play,
              book in KudosCourts and host from your reservation.
            </p>
          </div>
        </div>
        {cta ? <div>{cta}</div> : null}
      </CardContent>
    </Card>
  );
}
