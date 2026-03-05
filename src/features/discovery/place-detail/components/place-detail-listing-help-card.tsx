"use client";

import { ArrowRight, BadgeCheck, CircleHelp, Flag } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PlaceClaimStatus } from "@/features/discovery/hooks";
import type {
  ClaimFormData,
  RemovalFormData,
} from "@/features/discovery/place-detail/forms/schemas";

type SelectOption = {
  label: string;
  value: string;
};

export type PlaceDetailListingHelpCardProps = {
  canSubmitClaim: boolean;
  claimStatus: PlaceClaimStatus;
  claimStatusMessage: string | null;
  claimHelperText: string;
  removalHelperText: string;
  isClaimOpen: boolean;
  setIsClaimOpen: (open: boolean) => void;
  isRemovalOpen: boolean;
  setIsRemovalOpen: (open: boolean) => void;
  claimForm: UseFormReturn<ClaimFormData>;
  removalForm: UseFormReturn<RemovalFormData>;
  organizationOptions: SelectOption[];
  onClaimSubmit: (data: ClaimFormData) => Promise<void>;
  onRemovalSubmit: (data: RemovalFormData) => Promise<void>;
  claimSubmitting: boolean;
  claimDisabled: boolean;
  removalSubmitting: boolean;
  removalDisabled: boolean;
};

export function PlaceDetailListingHelpCard({
  canSubmitClaim,
  claimStatus,
  claimStatusMessage,
  claimHelperText,
  removalHelperText,
  isClaimOpen,
  setIsClaimOpen,
  isRemovalOpen,
  setIsRemovalOpen,
  claimForm,
  removalForm,
  organizationOptions,
  onClaimSubmit,
  onRemovalSubmit,
  claimSubmitting,
  claimDisabled,
  removalSubmitting,
  removalDisabled,
}: PlaceDetailListingHelpCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-transparent p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CircleHelp className="h-4 w-4" />
          <span>Listing help</span>
        </div>
        <span className="text-[11px] text-muted-foreground">For owners</span>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-lg bg-background/60 p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Claim this listing
                </p>
                <p className="text-xs text-muted-foreground">
                  Manage courts and enable bookings.
                </p>
              </div>
            </div>

            {canSubmitClaim && !claimStatusMessage && (
              <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs hover:translate-y-0"
                  >
                    Start claim
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Submit claim request</DialogTitle>
                    <DialogDescription>
                      Share your organization and any context for the admin
                      review.
                    </DialogDescription>
                  </DialogHeader>
                  <StandardFormProvider
                    form={claimForm}
                    onSubmit={onClaimSubmit}
                    className="space-y-4"
                  >
                    <StandardFormSelect<ClaimFormData>
                      name="organizationId"
                      label="Organization"
                      placeholder="Select organization"
                      options={organizationOptions}
                      required
                      disabled={organizationOptions.length === 1}
                    />
                    <StandardFormTextarea<ClaimFormData>
                      name="requestNotes"
                      label="Notes (optional)"
                      placeholder="Share any context that helps verify ownership."
                    />
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsClaimOpen(false)}
                        disabled={claimSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={claimDisabled}>
                        {claimSubmitting && <Spinner />}
                        Submit claim
                      </Button>
                    </DialogFooter>
                  </StandardFormProvider>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {claimStatusMessage ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {claimStatusMessage}
            </p>
          ) : !canSubmitClaim ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {claimHelperText}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg bg-background/60 p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Flag className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Report an issue
                </p>
                <p className="text-xs text-muted-foreground">
                  {removalHelperText}
                </p>
              </div>
            </div>

            {claimStatus !== "REMOVAL_REQUESTED" && (
              <Dialog open={isRemovalOpen} onOpenChange={setIsRemovalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs hover:translate-y-0"
                  >
                    Send report
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Request listing removal</DialogTitle>
                    <DialogDescription>
                      Share your contact details so we can follow up during
                      review.
                    </DialogDescription>
                  </DialogHeader>
                  <StandardFormProvider
                    form={removalForm}
                    onSubmit={onRemovalSubmit}
                    className="space-y-4"
                  >
                    <StandardFormInput<RemovalFormData>
                      name="guestName"
                      label="Full name"
                      placeholder="Your name"
                      required
                    />
                    <StandardFormInput<RemovalFormData>
                      name="guestEmail"
                      label="Email"
                      placeholder="you@example.com"
                      required
                    />
                    <StandardFormTextarea<RemovalFormData>
                      name="requestNotes"
                      label="Reason"
                      placeholder="Let us know why this listing should be removed."
                      required
                    />
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsRemovalOpen(false)}
                        disabled={removalSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={removalDisabled}>
                        {removalSubmitting && <Spinner />}
                        Submit request
                      </Button>
                    </DialogFooter>
                  </StandardFormProvider>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {claimStatus === "REMOVAL_REQUESTED" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Removal request submitted. We will review shortly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
