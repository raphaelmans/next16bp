"use client";

import Link from "next/link";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useMutCoachAcceptReservation,
  useMutCoachCancelReservation,
  useMutCoachConfirmPayment,
  useMutCoachRejectReservation,
  useQueryCoachReservationDetail,
} from "../hooks";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatShortDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Pending Review",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_MARKED_BY_USER: "Payment Marked",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CREATED: "default",
  AWAITING_PAYMENT: "secondary",
  PAYMENT_MARKED_BY_USER: "secondary",
  CONFIRMED: "default",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
};

export function CoachReservationDetailPage({
  reservationId,
}: {
  reservationId: string;
}) {
  const detail = useQueryCoachReservationDetail(reservationId);
  const acceptMut = useMutCoachAcceptReservation();
  const rejectMut = useMutCoachRejectReservation();
  const confirmMut = useMutCoachConfirmPayment();
  const cancelMut = useMutCoachCancelReservation();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");

  if (detail.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="space-y-4">
        <Link
          href={appRoutes.coach.reservations}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to Reservations
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {detail.error?.message ?? "Reservation not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { reservation, events } = detail.data;
  const status = reservation.status;
  const canAccept = status === "CREATED";
  const canReject = status === "CREATED";
  const canConfirmPayment = status === "PAYMENT_MARKED_BY_USER";
  const canCancel =
    status === "CREATED" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAYMENT_MARKED_BY_USER" ||
    status === "CONFIRMED";

  const handleAccept = () => {
    acceptMut.mutate({ reservationId });
  };

  const handleReject = () => {
    rejectMut.mutate(
      { reservationId, reason },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setReason("");
        },
      },
    );
  };

  const handleConfirmPayment = () => {
    confirmMut.mutate(
      { reservationId, notes: confirmNotes || undefined },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setConfirmNotes("");
        },
      },
    );
  };

  const handleCancel = () => {
    cancelMut.mutate(
      { reservationId, reason },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Link
        href={appRoutes.coach.reservations}
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Reservations
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Reservation Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {reservation.id.slice(0, 8)}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANTS[status] ?? "outline"}
          className="text-sm"
        >
          {STATUS_LABELS[status] ?? status}
        </Badge>
      </div>

      {/* Actions */}
      {(canAccept || canReject || canConfirmPayment || canCancel) && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              {canAccept
                ? "This booking is awaiting your review."
                : canConfirmPayment
                  ? "The player has marked payment. Please verify and confirm."
                  : "Manage this reservation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {canAccept && (
                <Button onClick={handleAccept} disabled={acceptMut.isPending}>
                  {acceptMut.isPending ? "Accepting..." : "Accept Booking"}
                </Button>
              )}
              {canConfirmPayment && (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={confirmMut.isPending}
                >
                  Confirm Payment
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={rejectMut.isPending}
                >
                  Reject
                </Button>
              )}
              {canCancel && !canReject && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                  disabled={cancelMut.isPending}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Start Time
              </dt>
              <dd className="mt-1">
                {reservation.startTime
                  ? formatDateTime(
                      typeof reservation.startTime === "string"
                        ? reservation.startTime
                        : reservation.startTime.toISOString(),
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                End Time
              </dt>
              <dd className="mt-1">
                {reservation.endTime
                  ? formatDateTime(
                      typeof reservation.endTime === "string"
                        ? reservation.endTime
                        : reservation.endTime.toISOString(),
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Amount
              </dt>
              <dd className="mt-1 text-lg font-semibold">
                {reservation.totalPriceCents != null && reservation.currency
                  ? formatCurrency(
                      reservation.totalPriceCents,
                      reservation.currency,
                    )
                  : "Free"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1">
                {reservation.createdAt
                  ? formatShortDateTime(
                      typeof reservation.createdAt === "string"
                        ? reservation.createdAt
                        : reservation.createdAt.toISOString(),
                    )
                  : "—"}
              </dd>
            </div>
            {reservation.expiresAt && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Expires At
                </dt>
                <dd className="mt-1">
                  {formatShortDateTime(
                    typeof reservation.expiresAt === "string"
                      ? reservation.expiresAt
                      : reservation.expiresAt.toISOString(),
                  )}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Player Info */}
      <Card>
        <CardHeader>
          <CardTitle>Player Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1">{reservation.playerNameSnapshot ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1">{reservation.playerEmailSnapshot ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Phone
              </dt>
              <dd className="mt-1">{reservation.playerPhoneSnapshot ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Payment Proof — not included in CoachReservationDetail yet; deferred to payment module step */}

      {/* Cancellation Reason */}
      {reservation.cancellationReason && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Cancellation Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{reservation.cancellationReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm">
                      {event.fromStatus && (
                        <span className="text-muted-foreground">
                          {STATUS_LABELS[event.fromStatus] ?? event.fromStatus}
                          {" → "}
                        </span>
                      )}
                      <span className="font-medium">
                        {STATUS_LABELS[event.toStatus] ?? event.toStatus}
                      </span>
                      {event.notes ? ` — ${event.notes}` : ""}
                    </p>
                    {event.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatShortDateTime(
                          typeof event.createdAt === "string"
                            ? event.createdAt
                            : event.createdAt.toISOString(),
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              This will cancel the booking request. The player will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're rejecting (required)..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMut.isPending || !reason.trim()}
            >
              {rejectMut.isPending ? "Rejecting..." : "Reject Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              This will cancel the reservation. The player will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're cancelling (required)..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMut.isPending || !reason.trim()}
            >
              {cancelMut.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Verify that you received the payment before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-notes">Notes (optional)</Label>
            <Textarea
              id="confirm-notes"
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              placeholder="Any notes about the payment..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={confirmMut.isPending}
            >
              {confirmMut.isPending ? "Confirming..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
