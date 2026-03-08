"use client";

import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface Reservation {
  id: string;
  startTime: Date;
  status: string;
  court?: {
    name: string;
    address?: string | null;
  } | null;
}

interface UpcomingReservationsProps {
  reservations: Reservation[];
  isLoading?: boolean;
}

export function UpcomingReservations({
  reservations,
  isLoading,
}: UpcomingReservationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reservations</CardTitle>
          <CardDescription>Your next scheduled games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded-md" />
            <div className="h-16 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Reservations</CardTitle>
            <CardDescription>Your next scheduled games</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={appRoutes.reservations.base}>View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reservations.length > 0 ? (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {reservation.court?.name || "Venue"}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(reservation.startTime), "MMM d, h:mm a")}
                    </span>
                    {reservation.court?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {reservation.court.address}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    reservation.status === "CONFIRMED" ? "default" : "secondary"
                  }
                >
                  {reservation.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-3 bg-muted rounded-full">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No upcoming reservations</p>
              <p className="text-sm text-muted-foreground">
                Ready to play? Find a venue near you.
              </p>
            </div>
            <Button asChild>
              <Link href={appRoutes.courts.base}>Browse Venues</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
