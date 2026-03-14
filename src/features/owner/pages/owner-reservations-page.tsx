"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ListChecks,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShortInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { getZonedDayKey } from "@/common/time-zone";
import { toast } from "@/common/toast";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  ConfirmDialog,
  OwnerPaymentMethodReminder,
  PlaceCourtFilter,
  RejectModal,
  ReservationsTable,
} from "@/features/owner/components";
import {
  OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  type Reservation,
  useModOwnerCourtFilter,
  useModOwnerInvalidation,
  useModOwnerPlaceFilter,
  useModOwnerReservationRealtimeStream,
  useModOwnerReservations,
  useMutAcceptReservation,
  useMutCancelReservation,
  useMutConfirmReservation,
  useMutOwnerConfirmPaidOffline,
  useMutRejectReservation,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerCourts,
  useQueryOwnerOrganization,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Status filter
// ---------------------------------------------------------------------------

const STATUS_VALUES = [
  "all",
  "needs-action",
  "awaiting-payment",
  "confirmed",
  "past",
] as const;

type StatusFilter = (typeof STATUS_VALUES)[number];

const SEARCH_PARAM = "q";

const paidOfflineFormSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().min(1, "Reference is required").max(100),
});

type PaidOfflineFormValues = z.infer<typeof paidOfflineFormSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatReservationDate(reservation: Reservation) {
  return formatDateShortInTimeZone(
    reservation.slotStartTime ?? reservation.createdAt,
    reservation.placeTimeZone,
  );
}

function formatReservationTimeRange(reservation: Reservation) {
  if (!reservation.slotStartTime || !reservation.slotEndTime) {
    return `${reservation.startTime} - ${reservation.endTime}`;
  }
  return formatTimeRangeInTimeZone(
    reservation.slotStartTime,
    reservation.slotEndTime,
    reservation.placeTimeZone,
  );
}

function isUpcoming(reservation: Reservation): boolean {
  const today = getZonedDayKey(new Date(), reservation.placeTimeZone);
  return reservation.date >= today;
}

function filterByStatus(
  reservations: Reservation[],
  status: StatusFilter,
): Reservation[] {
  switch (status) {
    case "all":
      return reservations.filter((r) => {
        if (
          r.reservationStatus === "CREATED" ||
          r.reservationStatus === "AWAITING_PAYMENT" ||
          r.reservationStatus === "PAYMENT_MARKED_BY_USER"
        )
          return true;
        if (r.reservationStatus === "CONFIRMED") return isUpcoming(r);
        return false;
      });
    case "needs-action":
      return reservations.filter(
        (r) =>
          r.reservationStatus === "CREATED" ||
          r.reservationStatus === "PAYMENT_MARKED_BY_USER",
      );
    case "awaiting-payment":
      return reservations.filter(
        (r) => r.reservationStatus === "AWAITING_PAYMENT",
      );
    case "confirmed":
      return reservations.filter(
        (r) => r.reservationStatus === "CONFIRMED" && isUpcoming(r),
      );
    case "past":
      return reservations.filter((r) => {
        if (
          r.reservationStatus === "EXPIRED" ||
          r.reservationStatus === "CANCELLED"
        )
          return true;
        if (r.reservationStatus === "CONFIRMED") return !isUpcoming(r);
        return false;
      });
  }
}

function computeCounts(reservations: Reservation[]) {
  let needsAction = 0;
  let awaitingPayment = 0;
  let confirmed = 0;
  let past = 0;

  for (const r of reservations) {
    if (
      r.reservationStatus === "CREATED" ||
      r.reservationStatus === "PAYMENT_MARKED_BY_USER"
    ) {
      needsAction++;
    } else if (r.reservationStatus === "AWAITING_PAYMENT") {
      awaitingPayment++;
    } else if (r.reservationStatus === "CONFIRMED") {
      if (isUpcoming(r)) confirmed++;
      else past++;
    } else {
      past++;
    }
  }

  return { needsAction, awaitingPayment, confirmed, past };
}

// ---------------------------------------------------------------------------
// Chip config
// ---------------------------------------------------------------------------

type ChipConfig = {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof ReturnType<typeof computeCounts>;
  activeClassName: string;
};

const STATUS_CHIPS: ChipConfig[] = [
  {
    value: "all",
    label: "All Active",
    icon: ListChecks,
    activeClassName: "border-primary/30 bg-primary/5 text-primary",
  },
  {
    value: "needs-action",
    label: "Needs Action",
    icon: AlertCircle,
    countKey: "needsAction",
    activeClassName: "border-warning/30 bg-warning/10 text-warning",
  },
  {
    value: "awaiting-payment",
    label: "Awaiting Payment",
    icon: Clock,
    countKey: "awaitingPayment",
    activeClassName: "border-warning/30 bg-warning/5 text-warning",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    countKey: "confirmed",
    activeClassName: "border-success/30 bg-success/5 text-success",
  },
  {
    value: "past",
    label: "Past",
    icon: CreditCard,
    countKey: "past",
    activeClassName: "border-border bg-muted/60 text-muted-foreground",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OwnerReservationsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { invalidateOwnerReservationsOverview } = useModOwnerInvalidation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // URL state
  const [statusParam, setStatusParam] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_VALUES)
      .withDefault("all")
      .withOptions({ history: "replace" }),
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    SEARCH_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  // Local search input (only applied on submit)
  const [searchInput, setSearchInput] = React.useState(searchQuery ?? "");

  // Sync local input when URL param changes externally (e.g. back/forward)
  React.useEffect(() => {
    setSearchInput(searchQuery ?? "");
  }, [searchQuery]);

  const activeStatus: StatusFilter = statusParam;

  // Org / places / courts
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const { data: places = [] } = useQueryOwnerPlaces(organization?.id ?? null);
  const { data: courts = [] } = useQueryOwnerCourts(organization?.id ?? null);

  const { placeId, setPlaceId } = useModOwnerPlaceFilter({
    persistToStorage: false,
  });
  const { courtId, setCourtId } = useModOwnerCourtFilter({
    persistToStorage: false,
  });

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [paidOfflineDialogOpen, setPaidOfflineDialogOpen] =
    React.useState(false);
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );

  // Applied search (from URL)
  const search = searchQuery?.trim() || undefined;

  // Single unified query
  const allQuery = useModOwnerReservations(organization?.id ?? null, {
    placeId: placeId || undefined,
    courtId: courtId || undefined,
    search,
    refetchIntervalMs: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  });

  // Realtime always on
  useModOwnerReservationRealtimeStream({
    enabled: Boolean(organization?.id),
  });

  // Mutations
  const acceptMutation = useMutAcceptReservation();
  const confirmMutation = useMutConfirmReservation();
  const rejectMutation = useMutRejectReservation();
  const cancelMutation = useMutCancelReservation();
  const confirmPaidOfflineMutation = useMutOwnerConfirmPaidOffline({
    onSuccess: async (_data, variables) => {
      await invalidateOwnerReservationsOverview({
        reservationId: variables.reservationId,
      });
    },
  });

  // Payment methods
  const { data: paymentMethodsData } = useQueryOrganizationPaymentMethods(
    organization?.id,
  );
  const paymentMethods = paymentMethodsData?.methods ?? [];
  const activePaymentMethods = paymentMethods.filter((m) => m.isActive);
  const defaultPaymentMethod = activePaymentMethods.find((m) => m.isDefault);

  const paidOfflineForm = useForm<PaidOfflineFormValues>({
    resolver: zodResolver(paidOfflineFormSchema),
    defaultValues: { paymentMethodId: "", paymentReference: "" },
  });

  // Derived data
  const allReservations = allQuery.data ?? [];

  const counts = React.useMemo(
    () => computeCounts(allReservations),
    [allReservations],
  );

  const filteredReservations = React.useMemo(() => {
    const filtered = filterByStatus(allReservations, activeStatus);
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [allReservations, activeStatus]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.reservations,
    );
  };

  const handleRefresh = async () => {
    if (!organization?.id) return;
    setIsRefreshing(true);
    try {
      await invalidateOwnerReservationsOverview();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = () => {
    const trimmed = searchInput.trim();
    void setSearchQuery(trimmed || null);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    void setSearchQuery(null);
  };

  const handleOpenConfirm = (reservationId: string) => {
    const reservation = allReservations.find((r) => r.id === reservationId);
    if (!reservation) return;
    setSelectedReservation(reservation);
    setConfirmDialogOpen(true);
  };

  const handleOpenReject = (reservationId: string) => {
    const reservation = allReservations.find((r) => r.id === reservationId);
    if (!reservation) return;
    setSelectedReservation(reservation);
    setRejectMode("reject");
    setRejectModalOpen(true);
  };

  const handleOpenCancel = (reservationId: string) => {
    const reservation = allReservations.find((r) => r.id === reservationId);
    if (!reservation) return;
    setSelectedReservation(reservation);
    setRejectMode("cancel");
    setRejectModalOpen(true);
  };

  const handleOpenPaidOffline = (reservationId: string) => {
    const reservation = allReservations.find((r) => r.id === reservationId);
    if (!reservation) return;
    setSelectedReservation(reservation);
    paidOfflineForm.reset({
      paymentMethodId: defaultPaymentMethod?.id ?? "",
      paymentReference: "",
    });
    setPaidOfflineDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedReservation) return;
    const isCreated = selectedReservation.reservationStatus === "CREATED";
    const mutation = isCreated ? acceptMutation : confirmMutation;

    mutation.mutate(
      { reservationId: selectedReservation.id },
      {
        onSuccess: () => {
          toast.success(
            isCreated ? "Reservation accepted" : "Payment confirmed",
          );
          setConfirmDialogOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error(
            isCreated
              ? "Failed to accept reservation"
              : "Failed to confirm payment",
          );
        },
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!selectedReservation) return;
    const mutation = rejectMode === "cancel" ? cancelMutation : rejectMutation;

    mutation.mutate(
      { reservationId: selectedReservation.id, reason },
      {
        onSuccess: () => {
          toast.success(
            rejectMode === "cancel"
              ? "Reservation cancelled"
              : "Reservation rejected",
          );
          setRejectModalOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to update reservation");
        },
      },
    );
  };

  const handlePaidOfflineSubmit = (values: PaidOfflineFormValues) => {
    if (!selectedReservation) return;

    confirmPaidOfflineMutation.mutate(
      {
        reservationId: selectedReservation.id,
        paymentMethodId: values.paymentMethodId,
        paymentReference: values.paymentReference,
      },
      {
        onSuccess: () => {
          toast.success("Reservation marked as paid and confirmed");
          setPaidOfflineDialogOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to mark reservation as paid and confirmed");
        },
      },
    );
  };

  // -------------------------------------------------------------------------
  // Derived labels
  // -------------------------------------------------------------------------

  const confirmTitle =
    selectedReservation?.reservationStatus === "CREATED"
      ? "Accept Reservation"
      : "Confirm Payment";
  const confirmLabel =
    selectedReservation?.reservationStatus === "CREATED" ? "Accept" : "Confirm";

  const mutationIsPending =
    acceptMutation.isPending ||
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    confirmPaidOfflineMutation.isPending;

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------

  if (orgLoading) {
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
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isSearchActive = Boolean(search);

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
        {/* Header */}
        <PageHeader
          title="Reservations"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          }
        />

        <OwnerPaymentMethodReminder />

        {/* Summary triage strip */}
        {!allQuery.isLoading &&
        (counts.needsAction > 0 || counts.awaitingPayment > 0) ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm font-medium text-foreground">
              {[
                counts.needsAction > 0 &&
                  `${counts.needsAction} need${counts.needsAction === 1 ? "s" : ""} action`,
                counts.awaitingPayment > 0 &&
                  `${counts.awaitingPayment} awaiting payment`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ) : null}

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((chip) => {
            const isActive = activeStatus === chip.value;
            const count = chip.countKey ? counts[chip.countKey] : undefined;
            const ChipIcon = chip.icon;

            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => void setStatusParam(chip.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? chip.activeClassName
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <ChipIcon className="h-4 w-4" />
                {chip.label}
                {count !== undefined && count > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                      isActive
                        ? "bg-current/10 text-inherit"
                        : "bg-muted-foreground/10 text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Search + venue/court filter */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <form
            className="relative w-full xl:max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search player, phone, or court"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn("pl-9", isSearchActive ? "pr-20" : "pr-16")}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isSearchActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSearchClear}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              <Button type="submit" size="sm" className="h-7 rounded-md px-2.5">
                Search
              </Button>
            </div>
          </form>

          <PlaceCourtFilter
            places={places}
            courts={courts}
            placeId={placeId}
            courtId={courtId}
            onPlaceChange={(value) => setPlaceId(value === "all" ? "" : value)}
            onCourtChange={(value) => setCourtId(value === "all" ? "" : value)}
          />
        </div>

        {/* Active search indicator */}
        {isSearchActive ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing results for{" "}
              <span className="font-medium text-foreground">"{search}"</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleSearchClear}
            >
              Clear
            </Button>
          </div>
        ) : null}

        {/* List */}
        {allQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <Empty className="border-0 bg-muted/20 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>
                {activeStatus === "all"
                  ? "All clear"
                  : activeStatus === "past"
                    ? "No past reservations"
                    : "Nothing here"}
              </EmptyTitle>
              <EmptyDescription>
                {activeStatus === "all"
                  ? "No active reservations right now. New requests will appear here automatically."
                  : activeStatus === "needs-action"
                    ? "No reservations need your attention right now."
                    : activeStatus === "awaiting-payment"
                      ? "No reservations are waiting on payment."
                      : activeStatus === "confirmed"
                        ? "No upcoming confirmed reservations."
                        : "No past reservations found."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ReservationsTable
            reservations={filteredReservations}
            onConfirm={handleOpenConfirm}
            onConfirmPaidOffline={handleOpenPaidOffline}
            onReject={handleOpenReject}
            onCancel={handleOpenCancel}
            isLoading={mutationIsPending}
          />
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isLoading={acceptMutation.isPending || confirmMutation.isPending}
        title={confirmTitle}
        confirmLabel={confirmLabel}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
        dateTime={
          selectedReservation
            ? `${formatReservationDate(selectedReservation)} at ${formatReservationTimeRange(selectedReservation)} for ${formatCurrency(
                selectedReservation.amountCents,
                selectedReservation.currency,
              )}`
            : undefined
        }
      />

      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        onReject={handleReject}
        isLoading={rejectMutation.isPending || cancelMutation.isPending}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
        title={
          rejectMode === "cancel" ? "Cancel Reservation" : "Reject Reservation"
        }
        reasonLabel={
          rejectMode === "cancel" ? "Reason for cancellation" : undefined
        }
        submitLabel={
          rejectMode === "cancel" ? "Cancel Reservation" : "Reject Reservation"
        }
      />

      <Dialog
        open={paidOfflineDialogOpen}
        onOpenChange={setPaidOfflineDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid & Confirmed</DialogTitle>
            <DialogDescription>
              Confirm that {selectedReservation?.playerName} is paid and
              confirmed for {selectedReservation?.courtName}. This skips the
              regular payment flow.
            </DialogDescription>
          </DialogHeader>
          {activePaymentMethods.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  You need at least one active payment method to mark
                  reservations as paid and confirmed.
                </p>
                <Button asChild>
                  <a
                    href={`${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`}
                  >
                    Set up payment methods
                  </a>
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaidOfflineDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <StandardFormProvider
              form={paidOfflineForm}
              onSubmit={handlePaidOfflineSubmit}
            >
              <div className="space-y-4">
                <StandardFormSelect<PaidOfflineFormValues>
                  name="paymentMethodId"
                  label="Payment method"
                  placeholder="Select payment method"
                  required
                  options={activePaymentMethods.map((method) => ({
                    value: method.id,
                    label: `${method.provider} — ${method.accountName}${method.isDefault ? " (Default)" : ""}`,
                  }))}
                />
                <StandardFormInput<PaidOfflineFormValues>
                  name="paymentReference"
                  label="Payment reference"
                  placeholder="e.g. receipt number, GCash ref"
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaidOfflineDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={confirmPaidOfflineMutation.isPending}
                >
                  Mark Paid & Confirmed
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
