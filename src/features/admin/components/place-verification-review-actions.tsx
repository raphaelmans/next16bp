"use client";

import { Check, Loader2, X } from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface PlaceVerificationReviewActionsProps {
  placeName: string;
  organizationName: string;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlaceVerificationReviewActions({
  placeName,
  organizationName,
  onApprove,
  onReject,
  isLoading,
  disabled,
}: PlaceVerificationReviewActionsProps) {
  const [decision, setDecision] = React.useState<"approve" | "reject">(
    "approve",
  );
  const [notes, setNotes] = React.useState("");
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (decision === "approve") {
      onApprove(notes || undefined);
    } else {
      onReject(notes);
    }
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={decision}
            onValueChange={(value) =>
              setDecision(value as "approve" | "reject")
            }
            disabled={disabled || isLoading}
          >
            <div className="flex items-start space-x-3 rounded-lg border border-green-200 bg-green-50/50 p-4">
              <RadioGroupItem value="approve" id="approve" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="approve" className="cursor-pointer font-medium">
                  Approve verification
                </Label>
                <p className="text-sm text-muted-foreground">
                  {placeName} will be marked as verified. Reservations remain
                  disabled until the owner enables them.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
              <RadioGroupItem value="reject" id="reject" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="reject" className="cursor-pointer font-medium">
                  Reject verification
                </Label>
                <p className="text-sm text-muted-foreground">
                  {organizationName} will be asked to resubmit documents.
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Review Notes{" "}
              {decision === "reject" && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                decision === "reject"
                  ? "Enter the reason for rejection (required)..."
                  : "Optional notes about this decision..."
              }
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              disabled={disabled || isLoading}
            />
            {decision === "reject" && (
              <p className="text-xs text-muted-foreground">
                This reason will be shared with the requester.
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              disabled || isLoading || (decision === "reject" && !notes.trim())
            }
            className="w-full"
            variant={decision === "approve" ? "default" : "destructive"}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {decision === "approve" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve verification
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Reject verification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "approve"
                ? "Approve verification?"
                : "Reject verification?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision === "approve" ? (
                <>
                  This marks <strong>{placeName}</strong> as verified and
                  notifies
                  <strong> {organizationName}</strong>.
                </>
              ) : (
                <>
                  {organizationName} will be notified with your rejection notes
                  and can resubmit documents.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className={
                decision === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {decision === "approve" ? "approval" : "rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
