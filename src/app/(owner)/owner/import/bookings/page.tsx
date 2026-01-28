"use client";

import {
  AlertCircle,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
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
import { PageHeader } from "@/components/ui/page-header";
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
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  useOwnerCourtsByPlace,
  useOwnerOrganization,
  useOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

type SourceType = "ics" | "csv" | "xlsx" | "image";

type CourtScope = "multi" | "single";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const SOURCE_OPTIONS: Array<{
  value: SourceType;
  label: string;
  description: string;
  extensions: string;
  icon: typeof FileText;
}> = [
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
];

const ACCEPT_BY_SOURCE: Record<SourceType, Accept> = {
  ics: {
    "text/calendar": [".ics"],
  },
  csv: {
    "text/csv": [".csv"],
    "application/csv": [".csv"],
  },
  xlsx: {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
  },
  image: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
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

export default function OwnerBookingsImportPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const [fromParam] = useQueryState("from", parseAsString);
  const isFromSetup = fromParam === "setup";
  const { data: places = [], isLoading: placesLoading } = useOwnerPlaces(
    organization?.id ?? null,
  );

  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);
  const [courtScope, setCourtScope] = useState<CourtScope>("multi");
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [courtScopeTouched, setCourtScopeTouched] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const createDraftMutation = trpc.bookingsImport.createDraft.useMutation();
  const aiUsageQuery = trpc.bookingsImport.aiUsage.useQuery(
    { placeId: selectedPlaceId },
    { enabled: Boolean(selectedPlaceId) },
  );

  const courtsQuery = useOwnerCourtsByPlace(selectedPlaceId);
  const placeCourts = courtsQuery.data ?? [];

  const isUploading = createDraftMutation.isPending;
  const acceptedExtensions = selectedSource
    ? getAcceptedExtensions(ACCEPT_BY_SOURCE[selectedSource])
    : "";

  const isDropzoneDisabled = !selectedPlaceId || !selectedSource || isUploading;
  const canContinue = Boolean(
    selectedPlaceId &&
      selectedSource &&
      selectedFile &&
      fileRejections.length === 0 &&
      (courtScope !== "single" || Boolean(selectedCourtId)) &&
      !isUploading,
  );

  useEffect(() => {
    if (!selectedPlaceId || !selectedSource) {
      setSelectedFile(null);
      setFileRejections([]);
      setInputKey((prev) => prev + 1);
      return;
    }
    setSelectedFile(null);
    setFileRejections([]);
    setInputKey((prev) => prev + 1);
  }, [selectedPlaceId, selectedSource]);

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
    accept: selectedSource ? ACCEPT_BY_SOURCE[selectedSource] : undefined,
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: isDropzoneDisabled,
    onDrop: (acceptedFiles, rejections) => {
      setSelectedFile(acceptedFiles[0] ?? null);
      setFileRejections(rejections);
    },
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileRejections([]);
    setInputKey((prev) => prev + 1);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.base);
  };

  const handleContinue = async () => {
    if (!canContinue || !selectedSource || !selectedFile) return;

    const formData = new FormData();
    formData.append("placeId", selectedPlaceId);
    formData.append("sourceType", selectedSource);
    if (courtScope === "single" && selectedCourtId) {
      formData.append("selectedCourtId", selectedCourtId);
    }
    formData.append("file", selectedFile, selectedFile.name);

    try {
      const job = await createDraftMutation.mutateAsync(formData);
      toast.success("Import draft uploaded", {
        description: "Redirecting to review page...",
      });
      const reviewHref = isFromSetup
        ? `${appRoutes.owner.imports.bookingsReview(job.id)}?from=setup`
        : appRoutes.owner.imports.bookingsReview(job.id);
      router.push(reviewHref);
    } catch (_error) {
      toast.error("Failed to upload import file");
    }
  };

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Import Existing Bookings"
          description="Bring in external reservations to prevent double-booking."
          breadcrumbs={[
            { label: "Owner", href: appRoutes.owner.base },
            { label: "Imports", href: appRoutes.owner.imports.bookings },
            { label: "Bookings" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  Step 1 of 4
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Upload source file
                </div>
              </div>
              <Progress value={25} />
              <div>
                <CardTitle>Choose venue and source</CardTitle>
                <CardDescription>
                  Select a venue, then choose the file type to route the import
                  correctly.
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
                  <Select
                    value={selectedPlaceId}
                    onValueChange={handlePlaceChange}
                  >
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
                  Choose whether this import applies to a single court or uses
                  court names from the file.
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
                        Assign every imported booking to one court (locked
                        during review).
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
                      {selectedSource === "image" ? (
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
                <Label className="font-heading">Source type (required)</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SOURCE_OPTIONS.map((option) => {
                    const isSelected = selectedSource === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          !isUploading && setSelectedSource(option.value)
                        }
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/40",
                          isUploading && "cursor-not-allowed opacity-70",
                        )}
                        disabled={isUploading}
                      >
                        <div
                          className={cn(
                            "mt-1 flex h-9 w-9 items-center justify-center rounded-md",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-heading text-sm font-semibold">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.extensions}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-heading">Upload file</Label>
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
                        ? "Select a venue and source type first"
                        : "Drag & drop your file, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSource
                        ? `Accepted: ${acceptedExtensions}`
                        : "Select a source type to see accepted formats"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max size: {formatBytes(MAX_FILE_SIZE)}
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(selectedFile.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
                <div className="text-xs text-muted-foreground">
                  We recommend starting with a single export per venue.
                </div>
                <Button onClick={handleContinue} disabled={!canContinue}>
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    Choose venue + source, then upload the file.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-heading text-foreground">2.</span>
                    AI normalizes your data (one-time per venue).
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
                  Select the source first to see accepted types.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map((option) => (
                  <Badge
                    key={option.value}
                    variant={
                      selectedSource === option.value ? "default" : "outline"
                    }
                  >
                    {option.extensions}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
