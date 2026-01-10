"use client";

import { Clock, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTime } from "@/shared/lib/format";

type BookingStatus = "booked" | "pending" | "available" | "blocked";

interface TimeSlotBooking {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus;
  playerName?: string;
  courtName?: string;
}

interface TodaysBookingsProps {
  bookings: TimeSlotBooking[];
  className?: string;
}

const statusConfig: Record<
  BookingStatus,
  { label: string; dotClassName: string; bgClassName: string }
> = {
  booked: {
    label: "Booked",
    dotClassName: "bg-success",
    bgClassName: "bg-success/10",
  },
  pending: {
    label: "Pending",
    dotClassName: "bg-warning",
    bgClassName: "bg-warning/10",
  },
  available: {
    label: "Available",
    dotClassName: "bg-primary",
    bgClassName: "bg-primary/10",
  },
  blocked: {
    label: "Blocked",
    dotClassName: "bg-muted-foreground",
    bgClassName: "bg-muted",
  },
};

export function TodaysBookings({ bookings, className }: TodaysBookingsProps) {
  if (bookings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No bookings scheduled for today
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Today&apos;s Bookings</CardTitle>
        <Badge variant="secondary">{bookings.length} slots</Badge>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          {/* Slots */}
          <div className="space-y-0">
            {bookings.map((booking, index) => {
              const config = statusConfig[booking.status];

              return (
                <div
                  key={booking.id}
                  className={cn(
                    "relative flex gap-4 py-3",
                    index !== bookings.length - 1 && "border-b",
                    config.bgClassName,
                  )}
                >
                  {/* Status dot */}
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "h-[14px] w-[14px] rounded-full border-2 border-background",
                        config.dotClassName,
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {formatTime(booking.startTime)} -{" "}
                          {formatTime(booking.endTime)}
                        </span>
                      </div>
                      <Badge
                        variant={
                          booking.status === "pending" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {config.label}
                      </Badge>
                    </div>

                    {booking.playerName && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{booking.playerName}</span>
                      </div>
                    )}

                    {booking.courtName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {booking.courtName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View all link */}
        <div className="pt-3 border-t mt-2">
          <Link
            href="/owner/reservations"
            className="text-sm text-primary hover:underline"
          >
            View all reservations
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
