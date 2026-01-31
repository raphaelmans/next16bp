"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import {
  formatDateShort,
  formatDateShortInTimeZone,
  formatTimeRange,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingSummaryCardProps {
  court: {
    name: string;
    address: string;
    coverImageUrl?: string;
  };
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  timeZone?: string;
  className?: string;
}

export function BookingSummaryCard({
  court,
  timeSlot,
  timeZone,
  className,
}: BookingSummaryCardProps) {
  const dateLabel = timeZone
    ? formatDateShortInTimeZone(timeSlot.startTime, timeZone)
    : formatDateShort(timeSlot.startTime);
  const timeLabel = timeZone
    ? formatTimeRangeInTimeZone(timeSlot.startTime, timeSlot.endTime, timeZone)
    : formatTimeRange(timeSlot.startTime, timeSlot.endTime);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Court image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {court.coverImageUrl ? (
            <Image
              src={court.coverImageUrl}
              alt={court.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-primary/40 font-heading text-4xl">KC</div>
              </div>
            </div>
          )}
        </div>

        {/* Court info */}
        <div>
          <h3 className="font-heading font-semibold text-lg">{court.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 text-accent" />
            <span>{court.address}</span>
          </div>
        </div>

        {/* Date and time */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{dateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium">{timeLabel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
