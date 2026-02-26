"use client";

import { useCallback, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import OwnerBookingsImportReviewView from "@/features/owner/components/bookings-import/bookings-import-review-coordinator";
import { BookingsImportUploadForm } from "@/features/owner/components/bookings-import/bookings-import-upload-form";

type ImportStep = "upload" | "review";

interface ImportBookingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess: () => void;
}

export function ImportBookingsSheet({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: ImportBookingsSheetProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [jobId, setJobId] = useState<string | null>(null);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setStep("upload");
        setJobId(null);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleDraftCreated = useCallback((id: string) => {
    setJobId(id);
    setStep("review");
  }, []);

  const handleComplete = useCallback(() => {
    handleOpenChange(false);
    onSuccess();
  }, [handleOpenChange, onSuccess]);

  const handleBack = useCallback(() => {
    setStep("upload");
    setJobId(null);
  }, []);

  const title = step === "upload" ? "Import bookings" : "Review import";
  const description =
    step === "upload"
      ? "Upload ICS, CSV, or XLSX files to import existing bookings."
      : "Review and fix imported rows before committing.";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-4xl"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {step === "upload" && organizationId ? (
            <BookingsImportUploadForm
              organizationId={organizationId}
              onDraftCreated={handleDraftCreated}
              onCancel={() => handleOpenChange(false)}
            />
          ) : null}
          {step === "review" && jobId ? (
            <OwnerBookingsImportReviewView
              jobId={jobId}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
