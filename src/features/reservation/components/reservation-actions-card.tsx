"use client";

import { Copy, Mail, MapPin, MessageSquare, Phone, X } from "lucide-react";
import { copyToClipboard } from "@/common/utils/clipboard";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  canCancel?: boolean;
  cancelDisabledReason?: string;
}

export function ReservationActionsCard({
  reservationId,
  status,
  court,
  organization,
  onCancel,
  canCancel,
  cancelDisabledReason,
}: ReservationActionsCardProps) {
  const activeChatStatuses: ReservationStatus[] = [
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
    "CONFIRMED",
  ];
  const canMessageOwner = activeChatStatuses.includes(status);

  const resolvedCanCancel =
    canCancel ??
    ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"].includes(status);

  const hasCoordinates = court.latitude && court.longitude;
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${court.name} ${court.address} ${court.city}`)}`;

  const handleOpenChat = () => {
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId,
          source: "reservation-detail",
        },
      }),
    );
  };

  return (
    <Card className="sticky top-4 overflow-hidden">
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
          {canMessageOwner ? (
            <>
              <Button className="w-full justify-start" onClick={handleOpenChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Owner
              </Button>
              {(status === "AWAITING_PAYMENT" ||
                status === "PAYMENT_MARKED_BY_USER") && (
                <p className="px-1 text-xs text-muted-foreground">
                  Need payment details or confirmation updates? Message the
                  owner directly.
                </p>
              )}
            </>
          ) : null}

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

          {onCancel && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onCancel}
                disabled={!resolvedCanCancel}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Reservation
              </Button>
              {!resolvedCanCancel && cancelDisabledReason && (
                <p className="text-xs text-muted-foreground">
                  {cancelDisabledReason}
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
