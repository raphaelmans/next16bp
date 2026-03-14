"use client";

import { Calendar, Clock3, UserRound } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatTime,
  formatTimeRange,
} from "@/common/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoachSessionDetailsCardProps {
  coach: {
    name: string;
    city?: string | null;
    province?: string | null;
    tagline?: string | null;
  };
  timeSlot: {
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
    createdAt?: string | Date;
  };
}

export function CoachSessionDetailsCard({
  coach,
  timeSlot,
}: CoachSessionDetailsCardProps) {
  const location = [coach.city, coach.province].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{coach.name}</p>
              {coach.tagline ? (
                <p className="text-sm text-muted-foreground">{coach.tagline}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {location || "Location details will be shared by your coach."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </div>
            <p className="font-medium">{formatDate(timeSlot.startTime)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Time
            </div>
            <p className="font-medium">
              {formatTimeRange(timeSlot.startTime, timeSlot.endTime)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Price
            </div>
            <p className="text-lg font-medium">
              {formatCurrency(timeSlot.priceCents, timeSlot.currency)}
            </p>
          </div>
          {timeSlot.createdAt ? (
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Booked On
              </div>
              <p className="font-medium">
                {formatDateShort(timeSlot.createdAt)} ·{" "}
                {formatTime(timeSlot.createdAt)}
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
