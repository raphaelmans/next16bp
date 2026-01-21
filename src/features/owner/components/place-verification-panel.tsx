"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { StandardFormProvider, StandardFormTextarea } from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildPlaceVerificationFormData,
  type PlaceVerificationStatus,
  type UploadPlaceVerificationInput,
  usePlaceVerification,
  useSubmitPlaceVerification,
  useTogglePlaceReservations,
} from "@/features/owner/hooks/use-place-verification";
import { cn } from "@/lib/utils";
import {
  FILE_SIZE_LIMITS_READABLE,
  MAX_VERIFICATION_DOCUMENT_SIZE,
} from "@/modules/storage/dtos";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

const STATUS_CONFIG: Record<
  PlaceVerificationStatus,
  {
    label: string;
    helper: string;
    icon: typeof ShieldCheck;
    badgeVariant: "secondary" | "success" | "warning" | "destructive";
    toneClass: string;
  }
> = {
  UNVERIFIED: {
    label: "Not verified",
    helper: "Submit documents to unlock bookings.",
    icon: AlertCircle,
    badgeVariant: "secondary",
    toneClass: "text-muted-foreground",
  },
  PENDING: {
    label: "Pending review",
    helper: "Our team is reviewing your submission.",
    icon: Clock,
    badgeVariant: "warning",
    toneClass: "text-warning",
  },
  VERIFIED: {
    label: "Verified",
    helper: "Your venue is verified. Enable reservations when ready.",
    icon: ShieldCheck,
    badgeVariant: "success",
    toneClass: "text-success",
  },
  REJECTED: {
    label: "Needs updates",
    helper: "Please resubmit with updated documentation.",
    icon: XCircle,
    badgeVariant: "destructive",
    toneClass: "text-destructive",
  },
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/x-pdf",
];

interface PlaceVerificationPanelProps {
  placeId: string;
  placeName: string;
  reservationCapable: boolean;
}

interface DocumentPreview {
  id: string;
  file: File;
}

const formatFileSize = (size: number) =>
  `${(size / 1024 / 1024).toFixed(2)} MB`;

export function PlaceVerificationPanel({
  placeId,
  placeName,
  reservationCapable,
}: PlaceVerificationPanelProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading } = usePlaceVerification(placeId);
  const submitVerification = useSubmitPlaceVerification(placeId);
  const toggleReservations = useTogglePlaceReservations(placeId);

  const [documents, setDocuments] = React.useState<DocumentPreview[]>([]);

  const form = useForm<{ requestNotes: string }>({
    defaultValues: { requestNotes: "" },
    mode: "onChange",
  });

  const {
    watch,
    reset,
    formState: { isValid },
  } = form;

  const requestNotes = watch("requestNotes");

  const verification = data?.verification;
  const request = data?.request;
  const status = verification?.status ?? "UNVERIFIED";
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const reservationsEnabled = verification?.reservationsEnabled ?? false;

  const isPending = status === "PENDING";
  const isVerified = status === "VERIFIED";
  const isRejected = status === "REJECTED";

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next: DocumentPreview[] = [];

    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Unsupported file type", {
          description: "Upload JPG, PNG, WebP, or PDF documents.",
        });
        return;
      }
      if (file.size > MAX_VERIFICATION_DOCUMENT_SIZE) {
        toast.error("File too large", {
          description: `Each file must be under ${FILE_SIZE_LIMITS_READABLE.VERIFICATION_DOCUMENT}.`,
        });
        return;
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file });
    });

    setDocuments((prev) => [...prev, ...next]);
  };

  const handleRemove = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleSubmit = async () => {
    if (!documents.length) {
      toast.error("Add at least one document to continue");
      return;
    }

    const payload: UploadPlaceVerificationInput = {
      placeId,
      documents: documents.map((doc) => doc.file),
      requestNotes: requestNotes?.trim() || undefined,
    };

    await submitVerification.mutateAsync(
      buildPlaceVerificationFormData(payload),
    );
    setDocuments([]);
    reset({ requestNotes: "" });

    const courts = await utils.courtManagement.listByPlace
      .fetch({ placeId })
      .catch(() => null);

    if (courts && courts.length === 0) {
      router.push(appRoutes.owner.places.courts.base(placeId));
    }
  };

  const handleToggleReservations = async () => {
    await toggleReservations.mutateAsync({
      placeId,
      enabled: !reservationsEnabled,
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Venue verification
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Verify {placeName} to unlock reservations and build trust.
            </p>
          </div>
          <Badge
            variant={config.badgeVariant}
            className={cn("px-3 py-1", config.toneClass)}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading verification status...
          </div>
        ) : (
          <Alert className="border-border/70 bg-muted/40">
            <StatusIcon className={cn("h-4 w-4", config.toneClass)} />
            <AlertTitle className="font-heading">{config.label}</AlertTitle>
            <AlertDescription>{config.helper}</AlertDescription>
          </Alert>
        )}

        {!reservationCapable && (
          <Alert className="border-warning/30 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle className="font-heading">Not reservable yet</AlertTitle>
            <AlertDescription>
              Enable reservable status before submitting verification.
            </AlertDescription>
          </Alert>
        )}

        {isVerified && (
          <div className="rounded-lg border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {reservationsEnabled ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  Reservations {reservationsEnabled ? "enabled" : "disabled"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle to start accepting bookings from players.
                </p>
              </div>
              <Button
                type="button"
                variant={reservationsEnabled ? "outline" : "default"}
                disabled={toggleReservations.isPending}
                onClick={handleToggleReservations}
                className="min-w-[160px]"
              >
                {toggleReservations.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : reservationsEnabled ? (
                  <ToggleLeft className="mr-2 h-4 w-4" />
                ) : (
                  <ToggleRight className="mr-2 h-4 w-4" />
                )}
                {reservationsEnabled
                  ? "Pause reservations"
                  : "Enable reservations"}
              </Button>
            </div>
          </div>
        )}

        {isPending && request && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Submitted on {new Date(request.createdAt).toLocaleDateString()}. We
            will email you once the review is complete.
          </div>
        )}

        {(status === "UNVERIFIED" || isRejected) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Upload documents</div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, WebP, PDF. Max size per file:{" "}
                {FILE_SIZE_LIMITS_READABLE.VERIFICATION_DOCUMENT}.
              </p>
              <div className="rounded-lg border border-dashed p-4">
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={(event) => handleFiles(event.target.files)}
                  className="hidden"
                  id={`verification-documents-${placeId}`}
                />
                <label
                  htmlFor={`verification-documents-${placeId}`}
                  className="flex cursor-pointer flex-col items-center gap-2 text-sm text-muted-foreground"
                >
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    Drag & drop files or click to browse
                  </span>
                  <span className="text-xs">
                    Proof of ownership, permits, or government IDs.
                  </span>
                </label>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">
                          {doc.file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(doc.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <StandardFormProvider
              form={form}
              onSubmit={async () => {
                await handleSubmit();
              }}
              className="space-y-4"
            >
              <StandardFormTextarea<{ requestNotes: string }>
                name="requestNotes"
                label="Notes (optional)"
                placeholder="Add supporting details for your submission"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    submitVerification.isPending ||
                    documents.length === 0 ||
                    !reservationCapable ||
                    !isValid
                  }
                >
                  {submitVerification.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit for review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDocuments([]);
                    reset({ requestNotes: "" });
                  }}
                >
                  Clear form
                </Button>
              </div>
            </StandardFormProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
