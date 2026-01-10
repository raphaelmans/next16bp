"use client";

import { Loader2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
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

interface RejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  playerName?: string;
  courtName?: string;
}

export function RejectModal({
  open,
  onOpenChange,
  onReject,
  isLoading,
  title = "Reject Booking",
  description,
  playerName,
  courtName,
}: RejectModalProps) {
  const [reason, setReason] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onReject(reason);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const defaultDescription = playerName
    ? `You are about to reject the booking for ${playerName}${courtName ? ` at ${courtName}` : ""}. Please provide a reason.`
    : "Please provide a reason for rejecting this booking.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejecting this booking..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                This reason will be sent to the player
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
