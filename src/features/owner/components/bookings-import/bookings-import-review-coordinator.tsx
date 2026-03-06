"use client";

import { AlertCircle, ChevronLeft, Edit, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { formatDateShort, formatTime } from "@/common/format";
import { toast } from "@/common/toast";
import { isRecord } from "@/common/type-guards";
import { AppShell } from "@/components/layout";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  useModOwnerInvalidation,
  useMutOwnerImportCommit,
  useMutOwnerImportDeleteRow,
  useMutOwnerImportDiscardJob,
  useMutOwnerImportNormalize,
  useMutOwnerImportUpdateRow,
  useQueryOwnerImportAiUsage,
  useQueryOwnerImportJob,
  useQueryOwnerImportRows,
  useQueryOwnerImportSources,
  useQueryOwnerOrganization,
  useQueryOwnerPublicPlaceById,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { RowStatusBadge } from "./row-status-badge";

type RowStatus =
  | "ALL"
  | "VALID"
  | "ERROR"
  | "WARNING"
  | "PENDING"
  | "COMMITTED";

type RowRecord = {
  id: string;
  lineNumber: number;
  sourceId: string | null;
  sourceLineNumber: number | null;
  status: string;
  courtId: string | null;
  courtLabel: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  errors: string[] | null;
  warnings: string[] | null;
};

type SourceRecord = {
  id: string;
  fileName: string;
  fileSize?: number | null;
  sourceType?: string | null;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

type OwnerBookingsImportReviewViewProps = {
  jobId: string;
  onComplete?: () => void;
  onBack?: () => void;
};

export default function OwnerBookingsImportReviewView({
  jobId,
  onComplete,
  onBack,
}: OwnerBookingsImportReviewViewProps) {
  const router = useRouter();
  const [fromParam] = useQueryState("from", parseAsString);
  const isFromSetup = fromParam === "setup";

  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const [statusFilter, setStatusFilter] = useState<RowStatus>("ALL");
  const [editingRow, setEditingRow] = useState<RowRecord | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showAiConfirmDialog, setShowAiConfirmDialog] = useState(false);

  // Edit form state
  const [editCourtId, setEditCourtId] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editReason, setEditReason] = useState("");

  const {
    invalidateImportAiUsage,
    invalidateImportJob,
    invalidateImportRows,
    invalidateImportRowsAndJob,
  } = useModOwnerInvalidation();

  const rowsQueryInput = {
    jobId,
    limit: 200,
    offset: 0,
  };

  const jobQuery = useQueryOwnerImportJob(
    { jobId },
    { enabled: Boolean(jobId) },
  );

  const rowsQuery = useQueryOwnerImportRows(rowsQueryInput, {
    enabled: Boolean(jobId),
  });

  const sourcesQuery = useQueryOwnerImportSources(
    { jobId },
    { enabled: Boolean(jobId) },
  );

  const studioHref = useMemo(() => {
    const job = jobQuery.data;
    if (!job) return null;
    const selectedCourtId =
      isRecord(job.metadata) && typeof job.metadata.selectedCourtId === "string"
        ? job.metadata.selectedCourtId
        : null;
    const params = new URLSearchParams({
      jobId,
      placeId: job.placeId,
    });
    if (selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }
    return `${appRoutes.organization.bookings}?${params.toString()}`;
  }, [jobId, jobQuery.data]);

  const placeQuery = useQueryOwnerPublicPlaceById(
    { placeId: jobQuery.data?.placeId ?? "" },
    { enabled: Boolean(jobQuery.data?.placeId) },
  );

  const aiUsageQuery = useQueryOwnerImportAiUsage(
    { placeId: jobQuery.data?.placeId ?? "" },
    { enabled: Boolean(jobQuery.data?.placeId) },
  );

  const normalizeMutation = useMutOwnerImportNormalize({
    onSuccess: (result) => {
      void invalidateImportJob({ jobId });
      void invalidateImportRows(rowsQueryInput);
      void invalidateImportAiUsage({
        placeId: jobQuery.data?.placeId ?? "",
      });
      setShowAiConfirmDialog(false);
      toast.success(
        `Normalized ${result.rowCount} rows (${result.validRowCount} valid, ${result.errorRowCount} errors)`,
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to normalize import");
    },
  });

  const updateRowMutation = useMutOwnerImportUpdateRow({
    onSuccess: () => {
      void invalidateImportRowsAndJob(rowsQueryInput, { jobId });
      setEditingRow(null);
      toast.success("Row updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update row");
    },
  });

  const deleteRowMutation = useMutOwnerImportDeleteRow({
    onSuccess: () => {
      void invalidateImportRowsAndJob(rowsQueryInput, { jobId });
      setDeletingRowId(null);
      toast.success("Row deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete row");
    },
  });

  const discardMutation = useMutOwnerImportDiscardJob({
    onSuccess: () => {
      toast.success("Import discarded");
      if (onComplete) {
        onComplete();
        return;
      }
      router.push(
        isFromSetup
          ? appRoutes.organization.getStarted
          : appRoutes.organization.imports.bookings,
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to discard import");
    },
  });

  const commitMutation = useMutOwnerImportCommit({
    onSuccess: (result) => {
      void invalidateImportRowsAndJob(rowsQueryInput, { jobId });
      setShowCommitDialog(false);

      if (result.failedRows > 0) {
        toast.warning(
          `Committed ${result.committedRows} rows. ${result.failedRows} failed.`,
        );
      } else {
        toast.success(`Successfully committed ${result.committedRows} rows`);
      }

      if (onComplete) {
        onComplete();
      } else if (isFromSetup) {
        router.push(appRoutes.organization.getStarted);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to commit import");
    },
  });

  const job = jobQuery.data;
  const rows: RowRecord[] = rowsQuery.data ?? [];
  const sources: SourceRecord[] = sourcesQuery.data ?? [];
  const sourceItems =
    sources.length > 0 && job
      ? sources
      : job
        ? [
            {
              id: job.id,
              fileName: job.fileName,
              fileSize: job.fileSize,
              sourceType: job.sourceType,
            },
          ]
        : [];
  const placeData = placeQuery.data;
  const courts = placeData?.courts ?? [];
  const place = placeData?.place;

  const selectedCourtId = useMemo(() => {
    if (!isRecord(job?.metadata)) return null;
    const value = job.metadata.selectedCourtId;
    return typeof value === "string" && value.length > 0 ? value : null;
  }, [job?.metadata]);

  const selectedCourtLabel = useMemo(() => {
    if (!selectedCourtId) return null;
    return (
      courts.find((c) => c.court.id === selectedCourtId)?.court.label ?? null
    );
  }, [courts, selectedCourtId]);

  const sourceById = useMemo(() => {
    return new Map(sources.map((source) => [source.id, source]));
  }, [sources]);

  const hasImageSource =
    sources.some((source) => source.sourceType === "image") ||
    job?.sourceType === "image";

  const sourceCount = sourceItems.length;
  const sourceTypeLabel =
    sources.length > 1
      ? "MIXED"
      : job?.sourceType
        ? job.sourceType.toUpperCase()
        : "-";

  const getRowSourceLabel = (row: RowRecord) => {
    const source = row.sourceId ? sourceById.get(row.sourceId) : null;
    const fileName = source?.fileName ?? job?.fileName ?? "File";
    const lineNumber = row.sourceLineNumber ?? row.lineNumber;
    return `${fileName} #${lineNumber}`;
  };

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<RowStatus, number> = {
      ALL: rows.length,
      VALID: 0,
      ERROR: 0,
      WARNING: 0,
      PENDING: 0,
      COMMITTED: 0,
    };
    for (const row of rows) {
      if (row.status in counts) {
        counts[row.status as RowStatus]++;
      }
    }
    return counts;
  }, [rows]);

  const canCommit =
    job?.status === "NORMALIZED" &&
    statusCounts.ERROR === 0 &&
    statusCounts.VALID > 0;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.organization.base);
  };

  const handleEditRow = (row: RowRecord) => {
    setEditingRow(row);
    setEditCourtId(selectedCourtId ?? row.courtId ?? "");
    setEditStartTime(
      row.startTime ? new Date(row.startTime).toISOString().slice(0, 16) : "",
    );
    setEditEndTime(
      row.endTime ? new Date(row.endTime).toISOString().slice(0, 16) : "",
    );
    setEditReason(row.reason ?? "");
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;

    const payload: {
      rowId: string;
      startTime: string | null;
      endTime: string | null;
      reason: string | null;
      courtId?: string | null;
    } = {
      rowId: editingRow.id,
      startTime: editStartTime ? new Date(editStartTime).toISOString() : null,
      endTime: editEndTime ? new Date(editEndTime).toISOString() : null,
      reason: editReason || null,
    };

    if (!selectedCourtId) {
      payload.courtId = editCourtId || null;
    }

    updateRowMutation.mutate(payload);
  };

  const handleDeleteRow = () => {
    if (!deletingRowId) return;
    deleteRowMutation.mutate({ rowId: deletingRowId });
  };

  const handleDiscard = () => {
    discardMutation.mutate({ jobId });
  };

  const handleCommit = () => {
    commitMutation.mutate({ jobId });
  };

  const handleNormalize = (mode: "deterministic" | "ai") => {
    if (mode === "ai") {
      setShowAiConfirmDialog(true);
    } else {
      normalizeMutation.mutate({ jobId, mode: "deterministic" });
    }
  };

  const handleConfirmAiNormalize = () => {
    normalizeMutation.mutate({
      jobId,
      mode: "ai",
      confirmAiOnce: true,
    });
  };

  const aiUsed = Boolean(aiUsageQuery.data?.usedAt);
  const isDraft = job?.status === "DRAFT";
  const isNormalizing = job?.status === "NORMALIZING";

  if (orgLoading || jobQuery.isLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "" }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName=""
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
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
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
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Import job not found</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </AppShell>
    );
  }

  const progress =
    job.status === "COMMITTED"
      ? 100
      : job.status === "NORMALIZED"
        ? 75
        : job.status === "NORMALIZING"
          ? 50
          : 25;

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
          title="Review Import"
          description={`${place?.name ?? ""} - ${sourceCount} file${sourceCount === 1 ? "" : "s"} import`}
          breadcrumbs={[
            { label: "Owner", href: appRoutes.organization.base },
            { label: "Imports", href: appRoutes.organization.imports.bookings },
            { label: "Review" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {isDraft || isNormalizing ? "Step 2 of 4" : "Step 3 of 4"}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {isDraft || isNormalizing
                      ? "Normalize data"
                      : "Review and fix errors"}
                  </div>
                </div>
                <Progress value={progress} className="mt-4" />
                {!isDraft && !isNormalizing && (
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">{job.rowCount ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid: </span>
                      <span className="font-medium text-success">
                        {job.validRowCount ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Errors: </span>
                      <span className="font-medium text-destructive">
                        {job.errorRowCount ?? 0}
                      </span>
                    </div>
                    {(job.committedRowCount ?? 0) > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Committed:{" "}
                        </span>
                        <span className="font-medium">
                          {job.committedRowCount}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isDraft || isNormalizing ? (
                  <div className="space-y-6">
                    {isNormalizing ? (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <Spinner className="h-8 w-8 text-primary" />
                        <p className="text-muted-foreground">
                          Normalizing your import data...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border p-4">
                          <h3 className="font-heading text-sm font-semibold">
                            Normalize Import Data
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Parse and validate the uploaded files to prepare
                            bookings for review.
                          </p>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            {!hasImageSource && (
                              <Button
                                onClick={() => handleNormalize("deterministic")}
                                disabled={normalizeMutation.isPending}
                              >
                                {normalizeMutation.isPending && (
                                  <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Parse files
                              </Button>
                            )}
                            <Button
                              variant={hasImageSource ? "default" : "outline"}
                              onClick={() => handleNormalize("ai")}
                              disabled={
                                normalizeMutation.isPending ||
                                aiUsed ||
                                aiUsageQuery.isLoading
                              }
                            >
                              {normalizeMutation.isPending && (
                                <Spinner className="mr-2 h-4 w-4" />
                              )}
                              Use AI (one-time)
                            </Button>
                          </div>
                          {hasImageSource && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Screenshot imports require AI normalization.
                            </p>
                          )}
                          {aiUsed && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              AI normalization was already used for this venue.
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">What happens next:</p>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            <li>
                              Your files will be parsed and converted to booking
                              rows
                            </li>
                            <li>
                              Court names will be matched to your venue courts
                            </li>
                            <li>
                              Time slots will be validated for hour-alignment
                            </li>
                            <li>Duplicates will be detected and flagged</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <Tabs
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v as RowStatus)}
                    >
                      <TabsList className="mb-4 overflow-x-auto">
                        <TabsTrigger value="ALL">
                          All ({statusCounts.ALL})
                        </TabsTrigger>
                        <TabsTrigger value="VALID">
                          Valid ({statusCounts.VALID})
                        </TabsTrigger>
                        <TabsTrigger value="ERROR">
                          Errors ({statusCounts.ERROR})
                        </TabsTrigger>
                        {statusCounts.WARNING > 0 && (
                          <TabsTrigger value="WARNING">
                            Warnings ({statusCounts.WARNING})
                          </TabsTrigger>
                        )}
                        {statusCounts.COMMITTED > 0 && (
                          <TabsTrigger value="COMMITTED">
                            Committed ({statusCounts.COMMITTED})
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </Tabs>

                    {rowsQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : filteredRows.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No rows match the current filter
                      </div>
                    ) : (
                      <>
                        {/* Mobile card layout */}
                        <div className="space-y-2 md:hidden">
                          {filteredRows.map((row) => {
                            const courtLabel =
                              courts.find((c) => c.court.id === row.courtId)
                                ?.court.label ??
                              row.courtLabel ??
                              "Unmapped";
                            return (
                              <div
                                key={row.id}
                                className={cn(
                                  "rounded-lg border p-3",
                                  row.status === "ERROR" && "bg-destructive/5",
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                                    <span className="font-mono">
                                      #{row.lineNumber}
                                    </span>
                                    <span className="truncate">
                                      {getRowSourceLabel(row)}
                                    </span>
                                  </div>
                                  <RowStatusBadge status={row.status} />
                                </div>
                                <div className="mt-1.5 text-sm font-medium">
                                  {courtLabel}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {row.startTime ? (
                                    <>
                                      {formatDateShort(new Date(row.startTime))}{" "}
                                      {formatTime(new Date(row.startTime))}
                                      {row.endTime && (
                                        <>
                                          {" → "}
                                          {formatDateShort(
                                            new Date(row.startTime),
                                          ) ===
                                          formatDateShort(new Date(row.endTime))
                                            ? formatTime(new Date(row.endTime))
                                            : `${formatDateShort(new Date(row.endTime))} ${formatTime(new Date(row.endTime))}`}
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </div>
                                {row.reason && (
                                  <div className="mt-1 text-xs truncate">
                                    {row.reason}
                                  </div>
                                )}
                                {row.errors && row.errors.length > 0 && (
                                  <div className="mt-1 text-xs text-destructive">
                                    {row.errors.map((err, i) => (
                                      <div key={`${row.id}-err-${i}`}>
                                        {err}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {row.status !== "COMMITTED" &&
                                  row.status !== "SKIPPED" && (
                                    <div className="mt-2 flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleEditRow(row)}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setDeletingRowId(row.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop table layout */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Court</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>End</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredRows.map((row) => (
                                <TableRow
                                  key={row.id}
                                  className={cn(
                                    row.status === "ERROR" &&
                                      "bg-destructive/5",
                                  )}
                                >
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {row.lineNumber}
                                  </TableCell>
                                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                                    {getRowSourceLabel(row)}
                                  </TableCell>
                                  <TableCell>
                                    {courts.find(
                                      (c) => c.court.id === row.courtId,
                                    )?.court.label ??
                                      row.courtLabel ?? (
                                        <span className="text-muted-foreground">
                                          Unmapped
                                        </span>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    {row.startTime ? (
                                      <span>
                                        {formatDateShort(
                                          new Date(row.startTime),
                                        )}{" "}
                                        {formatTime(new Date(row.startTime))}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {row.endTime ? (
                                      <span>
                                        {formatDateShort(new Date(row.endTime))}{" "}
                                        {formatTime(new Date(row.endTime))}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {row.reason ?? (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <RowStatusBadge status={row.status} />
                                      {row.errors && row.errors.length > 0 && (
                                        <div className="text-xs text-destructive">
                                          {row.errors.map((err, i) => (
                                            <div key={`${row.id}-err-${i}`}>
                                              {err}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {row.status !== "COMMITTED" &&
                                      row.status !== "SKIPPED" && (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditRow(row)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              setDeletingRowId(row.id)
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  {isDraft
                    ? "Process your import files"
                    : "Fix errors or commit valid rows"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {studioHref && !isDraft && !isNormalizing && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={studioHref}>Fix in studio</Link>
                  </Button>
                )}
                {!isDraft && !isNormalizing && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => setShowCommitDialog(true)}
                      disabled={!canCommit || commitMutation.isPending}
                    >
                      {commitMutation.isPending && (
                        <Spinner className="mr-2 h-4 w-4" />
                      )}
                      Commit {statusCounts.VALID} valid rows
                    </Button>

                    {statusCounts.ERROR > 0 && (
                      <p className="text-xs text-destructive">
                        Fix {statusCounts.ERROR} error(s) before committing
                      </p>
                    )}
                  </>
                )}

                <div
                  className={isDraft || isNormalizing ? "" : "border-t pt-3"}
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (onBack) {
                        onBack();
                        return;
                      }
                      router.push(
                        isFromSetup
                          ? appRoutes.organization.getStarted
                          : appRoutes.organization.imports.bookings,
                      );
                    }}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to imports
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDiscardDialog(true)}
                  disabled={
                    discardMutation.isPending || job.status === "COMMITTED"
                  }
                >
                  {discardMutation.isPending && (
                    <Spinner className="mr-2 h-4 w-4" />
                  )}
                  Discard import
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attached files</CardTitle>
                <CardDescription>
                  {sourceCount} file{sourceCount === 1 ? "" : "s"} uploaded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sourcesQuery.isLoading ? (
                  <Skeleton className="h-4 w-full" />
                ) : sourceItems.length === 0 ? (
                  <p className="text-muted-foreground">No files found.</p>
                ) : (
                  sourceItems.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{source.fileName}</span>
                      <span className="text-xs text-muted-foreground">
                        {(source.sourceType ?? "unknown").toUpperCase()} ·{" "}
                        {formatBytes(source.fileSize)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span>{sourceTypeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Court scope</span>
                  <span>
                    {selectedCourtId
                      ? `${selectedCourtLabel ?? "Single court"}`
                      : "Multiple courts"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span>{sourceCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Row Dialog */}
      <Dialog
        open={Boolean(editingRow)}
        onOpenChange={() => setEditingRow(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Row #{editingRow?.lineNumber}</DialogTitle>
            <DialogDescription>
              Update the booking details to fix errors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {selectedCourtId ? (
                <>
                  <Label className="text-sm">Court</Label>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    {selectedCourtLabel ?? "Selected court"}
                  </div>
                </>
              ) : (
                <>
                  <Label htmlFor="edit-court">Court</Label>
                  <Select value={editCourtId} onValueChange={setEditCourtId}>
                    <SelectTrigger id="edit-court">
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((c) => (
                        <SelectItem key={c.court.id} value={c.court.id}>
                          {c.court.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-start">Start time</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">End time</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason (optional)</Label>
              <Input
                id="edit-reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Imported booking"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateRowMutation.isPending}
            >
              {updateRowMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Row Confirmation */}
      <AlertDialog
        open={Boolean(deletingRowId)}
        onOpenChange={() => setDeletingRowId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete row?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this row from the import. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRowMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Confirmation */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard import?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the import job and all its rows. The
              uploaded files will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {discardMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commit Confirmation */}
      <AlertDialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Commit import?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create {statusCounts.VALID} court blocks from the valid
              rows. These blocks will prevent double-booking for the specified
              time slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCommit}>
              {commitMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Commit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Normalization Confirmation */}
      <AlertDialog
        open={showAiConfirmDialog}
        onOpenChange={setShowAiConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use AI normalization?</AlertDialogTitle>
            <AlertDialogDescription>
              AI normalization can only be used once per venue. After this, you
              will need to rely on deterministic parsing or manual corrections.
              This helps control AI costs while still providing the option for
              complex imports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAiNormalize}>
              {normalizeMutation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Use AI (one-time)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
