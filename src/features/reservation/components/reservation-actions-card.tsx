"use client";

import Link from "next/link";
import { MapPin, Mail, Phone, X, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  KudosStatusBadge,
  type ReservationStatus,
} from "@/shared/components/kudos";
import { copyToClipboard } from "@/shared/lib/clipboard";

interface ReservationActionsCardProps {
  reservationId: string;
  status: ReservationStatus;
  court: {
    latitude?: number;
    longitude?: number;
    name: string;
    address: string;
    city: string;
  };
  organization: {
    contactEmail?: string;
    contactPhone?: string;
  };
  onCancel?: () => void;
}

export function ReservationActionsCard({
  reservationId,
  status,
  court,
  organization,
  onCancel,
}: ReservationActionsCardProps) {
  const canCancel = [
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
  ].includes(status);

  const hasCoordinates = court.latitude && court.longitude;
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${court.name} ${court.address} ${court.city}`)}`;

  return (
    <Card className="sticky top-4">
      <CardContent className="p-4 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Status
          </div>
          <KudosStatusBadge status={status} size="lg" />
        </div>

        {/* Booking ID */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Booking ID
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate flex-1">
              {reservationId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => copyToClipboard(reservationId, "Booking ID")}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy booking ID</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="mr-2 h-4 w-4" />
              Get Directions
            </a>
          </Button>

          {organization.contactEmail && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`mailto:${organization.contactEmail}`}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Owner
              </a>
            </Button>
          )}

          {organization.contactPhone && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`tel:${organization.contactPhone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call Owner
              </a>
            </Button>
          )}

          {canCancel && onCancel && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onCancel}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Reservation
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
