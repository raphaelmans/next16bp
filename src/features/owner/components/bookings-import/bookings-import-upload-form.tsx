"use client";

import {
  AlertCircle,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "@/common/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMutOwnerImportCreateDraft,
  useQueryOwnerCourtsByPlace,
  useQueryOwnerImportAiUsage,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

type CourtScope = "multi" | "single";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 3;

const SUPPORTED_SOURCES = [
  {
    value: "ics",
    label: "ICS (Calendar export)",
    description: "Google or Apple calendar export",
    extensions: ".ics",
    icon: CalendarDays,
  },
  {
    value: "csv",
    label: "CSV",
    description: "Spreadsheet export",
    extensions: ".csv",
    icon: FileText,
  },
  {
    value: "xlsx",
    label: "XLSX",
    description: "Excel workbook",
    extensions: ".xlsx",
    icon: FileSpreadsheet,
  },
  {
    value: "image",
    label: "Calendar screenshot",
    description: "Photo of your calendar",
    extensions: ".png, .jpg",
    icon: ImageIcon,
  },
] as const;

const ACCEPT_ALL: Accept = {
  "text/calendar": [".ics"],
  "text/csv": [".csv"],
  "application/csv": [".csv"],
  "application/vnd.ms-excel": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const getAcceptedExtensions = (accept: Accept) =>
  Object.values(accept).flat().join(", ");

const getFileIcon = (file: File) => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".ics")) return CalendarDays;
  if (name.endsWith(".xlsx")) return FileSpreadsheet;
  if (name.endsWith(".csv")) return FileText;
  if (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    file.type.startsWith("image/")
  ) {
    return ImageIcon;
  }
  return FileText;
};

const isImageFile = (file: File) => {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  );
};

interface BookingsImportUploadFormProps {
  organizationId: string;
  onDraftCreated: (jobId: string) => void;
  onCancel: () => void;
}

export function BookingsImportUploadForm({
  organizationId,
  onDraftCreated,
  onCancel,
}: BookingsImportUploadFormProps) {
  const { data: places = [], isLoading: placesLoading } =
    useQueryOwnerPlaces(organizationId);

  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [courtScope, setCourtScope] = useState<CourtScope>("multi");
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [courtScopeTouched, setCourtScopeTouched] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const createDraftMutation = useMutOwnerImportCreateDraft();
  const aiUsageQuery = useQueryOwnerImportAiUsage(
    { placeId: selectedPlaceId },
    { enabled: Boolean(selectedPlaceId) },
  );

  const courtsQuery = useQueryOwnerCourtsByPlace(selectedPlaceId);
  const placeCourts = courtsQuery.data ?? [];

  const isUploading = createDraftMutation.isPending;
  const acceptedExtensions = getAcceptedExtensions(ACCEPT_ALL);
  const hasImageFiles = selectedFiles.some((file) => isImageFile(file));

  const isDropzoneDisabled = !selectedPlaceId || isUploading;
  const canContinue = Boolean(
    selectedPlaceId &&
      selectedFiles.length > 0 &&
      fileRejections.length === 0 &&
      (courtScope !== "single" || Boolean(selectedCourtId)) &&
      !isUploading,
  );

  useEffect(() => {
    if (!selectedPlaceId) {
      setSelectedFiles([]);
      setFileRejections([]);
      setInputKey((prev) => prev + 1);
      return;
    }
    setSelectedFiles([]);
    setFileRejections([]);
    setInputKey((prev) => prev + 1);
  }, [selectedPlaceId]);

  const handlePlaceChange = (placeId: string) => {
    setSelectedPlaceId(placeId);
    setCourtScope("multi");
    setSelectedCourtId("");
    setCourtScopeTouched(false);
  };

  useEffect(() => {
    if (!selectedPlaceId) return;
    if (courtsQuery.isLoading) return;
    if (courtScopeTouched) return;
    if (placeCourts.length === 1) {
      setCourtScope("single");
      setSelectedCourtId(placeCourts[0]?.id ?? "");
    }
  }, [courtScopeTouched, courtsQuery.isLoading, placeCourts, selectedPlaceId]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: ACCEPT_ALL,
    maxFiles: MAX_FILES,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    disabled: isDropzoneDisabled,
    onDrop: (acceptedFiles, rejections) => {
      setSelectedFiles(acceptedFiles);
      setFileRejections(rejections);
    },
  });

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, idx) => idx !== index));
    setFileRejections([]);
    setInputKey((prev) => prev + 1);
  };

  const handleContinue = async () => {
    if (!canContinue) return;

    const formData = new FormData();
    formData.append("placeId", selectedPlaceId);
    if (courtScope === "single" && selectedCourtId) {
      formData.append("selectedCourtId", selectedCourtId);
    }
    selectedFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });

    try {
      const job = await createDraftMutation.mutateAsync(formData);
      toast.success("Import draft uploaded", {
        description: "Proceeding to review...",
      });
      onDraftCreated(job.id);
    } catch (_error) {
      toast.error("Failed to upload import file");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              Step 1 of 4
            </Badge>
            <div className="text-sm text-muted-foreground">
              Upload source files
            </div>
          </div>
          <Progress value={25} />
          <div>
            <CardTitle>Choose venue and upload</CardTitle>
            <CardDescription>
              Upload up to three files in any combination of calendar, CSV,
              XLSX, or screenshots.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="venue-select" className="font-heading">
              Venue
            </Label>
            {placesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedPlaceId} onValueChange={handlePlaceChange}>
                <SelectTrigger id="venue-select" className="w-full">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {places.length === 0 ? (
                    <SelectItem value="" disabled>
                      No venues available
                    </SelectItem>
                  ) : (
                    places.map((place) => (
                      <SelectItem key={place.id} value={place.id}>
                        {place.name} · {place.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-3">
            <Label className="font-heading">Court scope (optional)</Label>
            <div className="text-xs text-muted-foreground">
              Choose whether this import applies to a single court or uses court
              names from the file.
            </div>

            <RadioGroup
              value={courtScope}
              onValueChange={(value) => {
                const next = value as CourtScope;
                setCourtScopeTouched(true);
                setCourtScope(next);
                if (next !== "single") {
                  setSelectedCourtId("");
                }
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                htmlFor="court-scope-multi"
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                  courtScope === "multi"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/40",
                )}
              >
                <RadioGroupItem
                  id="court-scope-multi"
                  value="multi"
                  className="mt-1"
                />
                <div className="space-y-1">
                  <div className="font-heading text-sm font-semibold">
                    Multiple courts
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Use court names in the file (you can remap rows during
                    review).
                  </div>
                </div>
              </label>

              <label
                htmlFor="court-scope-single"
                className={cn(
                  "flex gap-3 rounded-lg border p-4 transition-colors",
                  selectedPlaceId &&
                    !courtsQuery.isLoading &&
                    placeCourts.length > 0
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60",
                  courtScope === "single"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/40",
                )}
              >
                <RadioGroupItem
                  id="court-scope-single"
                  value="single"
                  className="mt-1"
                  disabled={
                    !selectedPlaceId ||
                    courtsQuery.isLoading ||
                    placeCourts.length === 0
                  }
                />
                <div className="space-y-1">
                  <div className="font-heading text-sm font-semibold">
                    Single court
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assign every imported booking to one court (locked during
                    review).
                  </div>
                </div>
              </label>
            </RadioGroup>

            {selectedPlaceId && courtScope === "single" ? (
              courtsQuery.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : placeCourts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No courts found</AlertTitle>
                  <AlertDescription>
                    Configure at least one court for this venue to use
                    single-court imports.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="court-select" className="text-sm">
                    Court
                  </Label>
                  <Select
                    value={selectedCourtId}
                    onValueChange={setSelectedCourtId}
                  >
                    <SelectTrigger id="court-select" className="w-full">
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {placeCourts.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasImageFiles ? (
                    <div className="text-xs text-muted-foreground">
                      Tip: screenshots often don't include court names.
                      Selecting a court avoids mapping errors.
                    </div>
                  ) : null}
                </div>
              )
            ) : null}
          </div>

          <div className="space-y-3">
            <Label className="font-heading">Upload files (up to 3)</Label>
            <div
              {...getRootProps({
                className: cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition",
                  isDropzoneDisabled
                    ? "cursor-not-allowed border-muted bg-muted/40 text-muted-foreground"
                    : "hover:border-primary/50",
                  isDragActive && "border-primary bg-primary/5",
                  isDragAccept && "border-primary",
                  isDragReject && "border-destructive bg-destructive/5",
                ),
              })}
            >
              <input key={inputKey} {...getInputProps()} />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDropzoneDisabled
                    ? "Select a venue first"
                    : "Drag & drop files, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accepted: {acceptedExtensions}
                </p>
                <p className="text-xs text-muted-foreground">
                  Max size: {formatBytes(MAX_FILE_SIZE)}
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => {
                  const Icon = getFileIcon(file);
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index)}
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {fileRejections.length > 0 && (
              <div className="space-y-2">
                {fileRejections.map((rejection) => (
                  <div
                    key={rejection.file.name}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-destructive">
                      {rejection.file.name}
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-destructive/90">
                      {rejection.errors.map((error) => (
                        <li key={error.code}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <Button onClick={handleContinue} disabled={!canContinue}>
              {isUploading ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              {isUploading ? "Uploading" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>
              Four quick steps to import safely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-heading text-foreground">1.</span>
                Choose a venue, then upload up to three files.
              </li>
              <li className="flex gap-2">
                <span className="font-heading text-foreground">2.</span>
                Normalize with AI or parsing (AI is one-time per venue).
              </li>
              <li className="flex gap-2">
                <span className="font-heading text-foreground">3.</span>
                Review and fix flagged rows.
              </li>
              <li className="flex gap-2">
                <span className="font-heading text-foreground">4.</span>
                Commit blocks to prevent double-booking.
              </li>
            </ol>
          </CardContent>
        </Card>

        {selectedPlaceId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AI normalization status</AlertTitle>
            <AlertDescription>
              {aiUsageQuery.isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : aiUsageQuery.isError ? (
                "Unable to load AI usage status right now."
              ) : aiUsageQuery.data?.usedAt ? (
                "AI normalization already used for this venue."
              ) : (
                "AI normalization available for this venue."
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import constraints</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              <li>Up to 3 files per import.</li>
              <li>Blocks must be hour-aligned (minute 0 only).</li>
              <li>Screenshot imports assume 1-hour duration.</li>
              <li>AI normalization can run once per venue.</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Supported formats</CardTitle>
            <CardDescription>
              Upload any combination of these file types.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUPPORTED_SOURCES.map((option) => (
              <Badge key={option.value} variant="outline">
                {option.extensions}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
