"use client";

import {
  Bell,
  Copy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { copyToClipboard } from "@/common/utils/clipboard";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useMutCreateOpenPlayFromReservation,
  useQueryOpenPlayForReservation,
} from "@/features/open-play/hooks";
import { useMutPingOwner } from "@/features/reservation/hooks";

interface ReservationActionsCardProps {
  reservationId: string;
  status: ReservationStatus;
  reservationTotalPriceCents: number;
  reservationCurrency: string;
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
  reservationTotalPriceCents,
  reservationCurrency,
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

  const canPingOwner =
    status === "CREATED" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAYMENT_MARKED_BY_USER";
  const pingOwnerMutation = useMutPingOwner();

  const canCreateOpenPlay =
    status === "CREATED" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAYMENT_MARKED_BY_USER" ||
    status === "CONFIRMED";
  const existingOpenPlayQuery = useQueryOpenPlayForReservation(
    reservationId,
    true,
  );
  const createOpenPlayMutation = useMutCreateOpenPlayFromReservation();
  const [openPlayDialogOpen, setOpenPlayDialogOpen] = React.useState(false);
  const [openPlayMaxPlayers, setOpenPlayMaxPlayers] = React.useState(4);
  const [openPlayJoinPolicy, setOpenPlayJoinPolicy] = React.useState<
    "REQUEST" | "AUTO"
  >("REQUEST");
  const [openPlayVisibility, setOpenPlayVisibility] = React.useState<
    "PUBLIC" | "UNLISTED"
  >("PUBLIC");
  const [openPlayNote, setOpenPlayNote] = React.useState("");
  const [openPlayPaymentInstructions, setOpenPlayPaymentInstructions] =
    React.useState("");
  const [openPlayPaymentLinkUrl, setOpenPlayPaymentLinkUrl] =
    React.useState("");

  const suggestedSplitPerPlayerCents =
    reservationTotalPriceCents > 0
      ? Math.ceil(reservationTotalPriceCents / Math.max(1, openPlayMaxPlayers))
      : 0;

  React.useEffect(() => {
    if (reservationTotalPriceCents > 0 && openPlayJoinPolicy !== "REQUEST") {
      setOpenPlayJoinPolicy("REQUEST");
    }
  }, [openPlayJoinPolicy, reservationTotalPriceCents]);

  const resolvedCanCancel =
    canCancel ??
    ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"].includes(status);

  const mobileReservationId =
    reservationId.length > 20
      ? `${reservationId.slice(0, 8)}...${reservationId.slice(-8)}`
      : reservationId;

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

  React.useEffect(() => {
    if (canCreateOpenPlay) {
      const openPlayQuery = new URLSearchParams(window.location.search).get(
        "openPlay",
      );
      if (openPlayQuery === "1" || openPlayQuery === "true") {
        setOpenPlayDialogOpen(true);
      }
    }
  }, [canCreateOpenPlay]);

  return (
    <Card className="sticky top-4 min-w-0 overflow-hidden">
      <CardContent className="min-w-0 space-y-4 p-4">
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
          <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
            <code className="min-w-0 flex-1 overflow-hidden rounded bg-muted px-2 py-1 font-mono text-sm">
              <span className="block truncate sm:hidden">
                {mobileReservationId}
              </span>
              <span className="hidden break-all sm:block">{reservationId}</span>
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
          {canCreateOpenPlay ? (
            existingOpenPlayQuery.data ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                  disabled={!existingOpenPlayQuery.data}
                >
                  <Link
                    href={appRoutes.openPlay.detail(
                      existingOpenPlayQuery.data?.id ?? "",
                    )}
                  >
                    View Open Play
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    existingOpenPlayQuery.data
                      ? copyToClipboard(
                          new URL(
                            appRoutes.openPlay.detail(
                              existingOpenPlayQuery.data.id,
                            ),
                            window.location.origin,
                          ).toString(),
                          "Open Play link",
                        )
                      : null
                  }
                >
                  Copy Open Play link
                </Button>
                {status !== "CONFIRMED" ? (
                  <p className="px-1 text-xs text-muted-foreground">
                    Your Open Play becomes visible and joinable only after the
                    reservation is confirmed.
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setOpenPlayDialogOpen(true)}
                >
                  Set up Open Play
                </Button>
                <p className="px-1 text-xs text-muted-foreground">
                  Set it up now. It becomes visible and joinable only after your
                  reservation is confirmed.
                </p>
              </>
            )
          ) : null}

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

          {canPingOwner ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={pingOwnerMutation.isPending}
              onClick={() => pingOwnerMutation.mutate({ reservationId })}
            >
              <Bell className="mr-2 h-4 w-4" />
              {pingOwnerMutation.isPending ? "Pinging..." : "Ping Owner"}
            </Button>
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

        <Dialog open={openPlayDialogOpen} onOpenChange={setOpenPlayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Open Play</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="opMaxPlayers">Max players</Label>
                <Input
                  id="opMaxPlayers"
                  type="number"
                  min={2}
                  max={32}
                  value={openPlayMaxPlayers}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10);
                    setOpenPlayMaxPlayers(Number.isFinite(next) ? next : 4);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Join policy</Label>
                <Select
                  value={openPlayJoinPolicy}
                  onValueChange={(value) =>
                    setOpenPlayJoinPolicy(value as "REQUEST" | "AUTO")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUEST">
                      Request (Host approves)
                    </SelectItem>
                    <SelectItem
                      value="AUTO"
                      disabled={reservationTotalPriceCents > 0}
                    >
                      Auto-join (If spots)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {reservationTotalPriceCents > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Paid sessions require host approval.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={openPlayVisibility}
                  onValueChange={(value) =>
                    setOpenPlayVisibility(value as "PUBLIC" | "UNLISTED")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="UNLISTED">
                      Unlisted (Link only)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opNote">Note (optional)</Label>
                <Input
                  id="opNote"
                  value={openPlayNote}
                  onChange={(e) => setOpenPlayNote(e.target.value)}
                  placeholder="e.g. Beginner-friendly"
                />
              </div>

              <div className="space-y-2">
                <Label>Reservation total</Label>
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  {formatCurrency(
                    reservationTotalPriceCents,
                    reservationCurrency,
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Suggested split</Label>
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  Est.{" "}
                  {formatCurrency(
                    suggestedSplitPerPlayerCents,
                    reservationCurrency,
                  )}
                  /player (based on {openPlayMaxPlayers} players)
                </div>
                {reservationTotalPriceCents > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    For paid sessions, use Request so you can confirm players
                    after payment.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opPaymentInstructions">
                  Payment instructions (optional)
                </Label>
                <Input
                  id="opPaymentInstructions"
                  value={openPlayPaymentInstructions}
                  onChange={(e) =>
                    setOpenPlayPaymentInstructions(e.target.value)
                  }
                  placeholder="e.g. GCash 09xx..., send screenshot in chat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opPaymentLinkUrl">
                  Payment link (optional)
                </Label>
                <Input
                  id="opPaymentLinkUrl"
                  type="url"
                  value={openPlayPaymentLinkUrl}
                  onChange={(e) => setOpenPlayPaymentLinkUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenPlayDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      const _created = await createOpenPlayMutation.mutateAsync(
                        {
                          reservationId,
                          maxPlayers: Math.max(
                            2,
                            Math.min(32, openPlayMaxPlayers),
                          ),
                          joinPolicy: openPlayJoinPolicy,
                          visibility: openPlayVisibility,
                          note:
                            openPlayNote.trim().length > 0
                              ? openPlayNote.trim()
                              : undefined,
                          paymentInstructions:
                            openPlayPaymentInstructions.trim().length > 0
                              ? openPlayPaymentInstructions.trim()
                              : undefined,
                          paymentLinkUrl:
                            openPlayPaymentLinkUrl.trim().length > 0
                              ? openPlayPaymentLinkUrl.trim()
                              : undefined,
                        },
                      );
                      setOpenPlayDialogOpen(false);
                      // Preserve reservation flow; Open Play will appear via query invalidation.
                    } catch {
                      // toast handled in hook
                    }
                  }}
                  disabled={createOpenPlayMutation.isPending}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
