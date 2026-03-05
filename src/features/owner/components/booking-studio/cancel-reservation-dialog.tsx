"use client";

import * as React from "react";
import { formatCurrency, formatTimeRangeInTimeZone } from "@/common/format";
import { toast } from "@/common/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutCancelReservation } from "@/features/owner/hooks/reservations";
import { useBookingStudio } from "./booking-studio-provider";

export const CancelReservationDialog = React.memo(
  function CancelReservationDialog({ timeZone }: { timeZone: string }) {
    const selectedReservation = useBookingStudio((s) => s.selectedReservation);
    const setSelectedReservation = useBookingStudio(
      (s) => s.setSelectedReservation,
    );
    const [reason, setReason] = React.useState("");
    const cancelMutation = useMutCancelReservation();

    const open = selectedReservation !== null;
    const isConfirmed = selectedReservation?.status === "CONFIRMED";
    const hasLinkedReservations = Boolean(selectedReservation?.groupId);

    const handleClose = React.useCallback(() => {
      setSelectedReservation(null);
      setReason("");
    }, [setSelectedReservation]);

    const handleCancel = React.useCallback(async () => {
      if (!selectedReservation || !reason.trim()) return;

      try {
        await cancelMutation.mutateAsync({
          reservationId: selectedReservation.id,
          reason: reason.trim(),
        });
        toast.success("Reservation cancelled");
        handleClose();
      } catch {
        toast.error("Failed to cancel reservation. Please try again.");
      }
    }, [selectedReservation, reason, cancelMutation, handleClose]);

    if (!selectedReservation) return null;

    const isGuest = Boolean(selectedReservation.guestProfileId);
    const label =
      selectedReservation.playerNameSnapshot ?? (isGuest ? "Guest" : "Player");
    const statusLabel =
      selectedReservation.status === "CONFIRMED"
        ? "Confirmed"
        : selectedReservation.status === "CREATED"
          ? "Pending"
          : selectedReservation.status === "AWAITING_PAYMENT"
            ? "Awaiting Payment"
            : selectedReservation.status;

    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>
              {label} &middot;{" "}
              {formatTimeRangeInTimeZone(
                selectedReservation.startTime,
                selectedReservation.endTime,
                timeZone,
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={isConfirmed ? "success" : "secondary"}
                className="text-xs"
              >
                {statusLabel}
              </Badge>
              {selectedReservation.totalPriceCents > 0 && (
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(
                    selectedReservation.totalPriceCents,
                    selectedReservation.currency,
                  )}
                </span>
              )}
              {hasLinkedReservations && (
                <Badge variant="outline" className="text-xs">
                  Linked booking
                </Badge>
              )}
            </div>

            {isConfirmed && (
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">
                  Cancellation reason{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="e.g. Court damaged, double-booking, weather closure..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {isConfirmed && (
              <Button
                variant="destructive"
                disabled={!reason.trim() || cancelMutation.isPending}
                onClick={handleCancel}
              >
                {cancelMutation.isPending && <Spinner />} Cancel Reservation
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
