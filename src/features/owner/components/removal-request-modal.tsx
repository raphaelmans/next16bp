"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  StandardFormCheckbox,
  StandardFormField,
  StandardFormProvider,
} from "@/components/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import {
  type RemovalRequestFormData,
  removalRequestSchema,
} from "../schemas/organization.schema";

interface RemovalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RemovalRequestFormData) => Promise<void> | void;
  isLoading?: boolean;
}

export function RemovalRequestModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: RemovalRequestModalProps) {
  const form = useForm<RemovalRequestFormData>({
    resolver: zodResolver(removalRequestSchema),
    mode: "onChange",
    defaultValues: {
      reason: "",
      acknowledgeReservations: false,
      acknowledgeApproval: false,
    },
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleSubmit = async (data: RemovalRequestFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      toast.error("Unable to submit removal request", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const submitting = Boolean(isLoading || isSubmitting);
  const isSubmitDisabled = submitting || !isValid || !isDirty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Request Listing Removal
          </DialogTitle>
          <DialogDescription>
            This action will remove your courts from public listings and cancel
            all pending reservations.
          </DialogDescription>
        </DialogHeader>

        <StandardFormProvider
          form={form}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All pending reservations will be cancelled</li>
                <li>Your courts will be removed from public search</li>
                <li>This request requires admin approval</li>
              </ul>
            </AlertDescription>
          </Alert>

          <StandardFormField<RemovalRequestFormData>
            name="reason"
            label="Reason for leaving"
            required
          >
            {({ field }) => (
              <Textarea
                placeholder="Please tell us why you're requesting removal..."
                rows={4}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          </StandardFormField>

          <div className="space-y-4">
            <StandardFormCheckbox<RemovalRequestFormData>
              name="acknowledgeReservations"
              label="I understand that all pending reservations will be cancelled and affected players will be notified"
            />

            <StandardFormCheckbox<RemovalRequestFormData>
              name="acknowledgeApproval"
              label="I understand that this request requires admin approval and may take 24-48 hours to process"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitDisabled}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </StandardFormProvider>
      </DialogContent>
    </Dialog>
  );
}
