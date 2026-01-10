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
import type { ClaimType } from "../hooks/use-claims";

interface ClaimReviewActionsProps {
  claimType: ClaimType;
  courtName: string;
  organizationName: string;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ClaimReviewActions({
  claimType,
  courtName,
  organizationName,
  onApprove,
  onReject,
  isLoading,
  disabled,
}: ClaimReviewActionsProps) {
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

  const isRemoval = claimType === "removal";

  const approveDescription = isRemoval
    ? "The court will be deactivated or returned to curated status. The organization will lose ownership."
    : "The court will become RESERVABLE and the organization will gain full ownership.";

  const rejectDescription = isRemoval
    ? "The court will remain active under the current organization's ownership."
    : "The claim will be rejected and the court will remain CURATED.";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={decision}
            onValueChange={(v) => setDecision(v as "approve" | "reject")}
            disabled={disabled || isLoading}
          >
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-green-50/50 border-green-200">
              <RadioGroupItem value="approve" id="approve" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="approve" className="font-medium cursor-pointer">
                  {isRemoval ? "Approve Removal Request" : "Approve Claim"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {approveDescription}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-red-50/50 border-red-200">
              <RadioGroupItem value="reject" id="reject" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="reject" className="font-medium cursor-pointer">
                  {isRemoval ? "Reject Removal Request" : "Reject Claim"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {rejectDescription}
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
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={disabled || isLoading}
            />
            {decision === "reject" && (
              <p className="text-xs text-muted-foreground">
                This reason will be shared with the requester
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
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {decision === "approve" ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isRemoval ? "Approve Removal" : "Approve Claim"}
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                {isRemoval ? "Reject Removal" : "Reject Claim"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "approve"
                ? `Approve ${isRemoval ? "Removal" : "Claim"}?`
                : `Reject ${isRemoval ? "Removal" : "Claim"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision === "approve" ? (
                isRemoval ? (
                  <>
                    This will deactivate <strong>{courtName}</strong> and remove{" "}
                    <strong>{organizationName}</strong>&apos;s ownership. All
                    pending reservations will be cancelled.
                  </>
                ) : (
                  <>
                    This will transfer ownership of <strong>{courtName}</strong>{" "}
                    to <strong>{organizationName}</strong>. The court type will
                    change to RESERVABLE.
                  </>
                )
              ) : (
                <>
                  The {isRemoval ? "removal request" : "claim"} will be
                  rejected. {organizationName} will be notified with your
                  provided reason.
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
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {decision === "approve" ? "Approval" : "Rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
