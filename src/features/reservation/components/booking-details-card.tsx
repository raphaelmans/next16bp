"use client";

import { Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsEmbed } from "@/shared/components/kudos";
import {
  formatCurrency,
  formatDate,
  formatTimeRange,
} from "@/shared/lib/format";

interface BookingDetailsCardProps {
  court: {
    name: string;
    address: string;
    city: string;
    coverImageUrl?: string;
    latitude?: number;
    longitude?: number;
  };
  timeSlot: {
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
  };
}

export function BookingDetailsCard({
  court,
  timeSlot,
}: BookingDetailsCardProps) {
  const hasCoordinates =
    typeof court.latitude === "number" &&
    Number.isFinite(court.latitude) &&
    typeof court.longitude === "number" &&
    Number.isFinite(court.longitude);
  const mapQuery = `${court.name} ${court.address} ${court.city}`;
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const openInMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Court info */}
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {court.coverImageUrl ? (
              <Image
                src={court.coverImageUrl}
                alt={court.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-foreground">{court.name}</h3>
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {court.address}, {court.city}
              </span>
            </div>
          </div>
        </div>

        {/* Booking info grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </div>
            <p className="font-medium">{formatDate(timeSlot.startTime)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" />
              Time
            </div>
            <p className="font-medium">
              {formatTimeRange(timeSlot.startTime, timeSlot.endTime)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Price
            </div>
            <p className="font-medium text-lg">
              {formatCurrency(timeSlot.priceCents, timeSlot.currency)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Location
          </div>
          <GoogleMapsEmbed
            title={`${court.name} location`}
            lat={court.latitude}
            lng={court.longitude}
            query={mapQuery}
            className="aspect-[16/9] w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="mr-2 h-4 w-4" />
              Get Directions
            </a>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href={openInMapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
