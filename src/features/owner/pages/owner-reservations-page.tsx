"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
        ) {
          return true;
        }
        if (r.reservationStatus === "CONFIRMED") {
          return isUpcoming(r);
        }
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
        ) {
          return true;
        }
        if (r.reservationStatus === "CONFIRMED") {
          return !isUpcoming(r);
        }
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
      if (isUpcoming(r)) {
        confirmed++;
      } else {
        past++;
      }
    } else {
      past++;
    }
  }

  return { needsAction, awaitingPayment, confirmed, past };
}

const STATUS_CHIPS: {
  value: StatusFilter;
  label: string;
  countKey?: keyof ReturnType<typeof computeCounts>;
}[] = [
  { value: "all", label: "All Active" },
  { value: "needs-action", label: "Needs Action", countKey: "needsAction" },
  {
    value: "awaiting-payment",
    label: "Awaiting Payment",
    countKey: "awaitingPayment",
  },
  { value: "confirmed", label: "Confirmed", countKey: "confirmed" },
  { value: "past", label: "Past", countKey: "past" },
];

export default function OwnerReservationsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { invalidateOwnerReservationsOverview } = useModOwnerInvalidation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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

  const activeStatus: StatusFilter = statusParam;

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

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [paidOfflineDialogOpen, setPaidOfflineDialogOpen] =
    React.useState(false);
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );

  const search = searchQuery?.trim() || undefined;

  const allQuery = useModOwnerReservations(organization?.id ?? null, {
    placeId: placeId || undefined,
    courtId: courtId || undefined,
    search,
    refetchIntervalMs: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  });

  useModOwnerReservationRealtimeStream({
    enabled: Boolean(organization?.id),
  });

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

  const { data: paymentMethodsData } = useQueryOrganizationPaymentMethods(
    organization?.id,
  );
  const paymentMethods = paymentMethodsData?.methods ?? [];
  const activePaymentMethods = paymentMethods.filter(
    (method) => method.isActive,
  );
  const defaultPaymentMethod = activePaymentMethods.find(
    (method) => method.isDefault,
  );

  const paidOfflineForm = useForm<PaidOfflineFormValues>({
    resolver: zodResolver(paidOfflineFormSchema),
    defaultValues: { paymentMethodId: "", paymentReference: "" },
  });

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

  const handleOpenConfirm = (reservationId: string) => {
    const reservation = allReservations.find(
      (item) => item.id === reservationId,
    );
    if (!reservation) return;
    setSelectedReservation(reservation);
    setConfirmDialogOpen(true);
  };

  const handleOpenReject = (reservationId: string) => {
    const reservation = allReservations.find(
      (item) => item.id === reservationId,
    );
    if (!reservation) return;
    setSelectedReservation(reservation);
    setRejectMode("reject");
    setRejectModalOpen(true);
  };

  const handleOpenCancel = (reservationId: string) => {
    const reservation = allReservations.find(
      (item) => item.id === reservationId,
    );
    if (!reservation) return;
    setSelectedReservation(reservation);
    setRejectMode("cancel");
    setRejectModalOpen(true);
  };

  const handleOpenPaidOffline = (reservationId: string) => {
    const reservation = allReservations.find(
      (item) => item.id === reservationId,
    );
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
    const successMessage = isCreated
      ? "Reservation accepted"
      : "Payment confirmed";
    const errorMessage = isCreated
      ? "Failed to accept reservation"
      : "Failed to confirm payment";

    mutation.mutate(
      {
        reservationId: selectedReservation.id,
      },
      {
        onSuccess: () => {
          toast.success(successMessage);
          setConfirmDialogOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error(errorMessage);
        },
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!selectedReservation) return;
    const mutation = rejectMode === "cancel" ? cancelMutation : rejectMutation;

    mutation.mutate(
      {
        reservationId: selectedReservation.id,
        reason,
      },
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  const summaryParts: string[] = [];
  if (counts.needsAction > 0) {
    summaryParts.push(
      `${counts.needsAction} need${counts.needsAction === 1 ? "s" : ""} action`,
    );
  }
  if (counts.awaitingPayment > 0) {
    summaryParts.push(`${counts.awaitingPayment} awaiting payment`);
  }
  if (counts.confirmed > 0) {
    summaryParts.push(`${counts.confirmed} confirmed`);
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

        {summaryParts.length > 0 && !allQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">
            {summaryParts.join(" · ")}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((chip) => {
            const isActive = activeStatus === chip.value;
            const count = chip.countKey ? counts[chip.countKey] : undefined;
            return (
              <Button
                key={chip.value}
                type="button"
                variant={isActive ? "secondary" : "outline"}
                onClick={() => void setStatusParam(chip.value)}
              >
                {chip.label}
                {count !== undefined && count > 0 ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2 px-1.5 py-0 text-xs",
                      isActive && "bg-background",
                    )}
                  >
                    {count}
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search player, phone, email, or court"
              value={searchQuery ?? ""}
              onChange={(event) =>
                void setSearchQuery(event.target.value || null)
              }
              className="pl-9"
            />
          </div>
          <PlaceCourtFilter
            places={places}
            courts={courts}
            placeId={placeId}
            courtId={courtId}
            onPlaceChange={(value) =>
              setPlaceId(value === "all" ? "" : value)
            }
            onCourtChange={(value) =>
              setCourtId(value === "all" ? "" : value)
            }
          />
        </div>

        {allQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <Empty className="border-0 bg-muted/20 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>
                {activeStatus === "all" ? "All clear" : "No reservations"}
              </EmptyTitle>
              <EmptyDescription>
                {activeStatus === "all"
                  ? "No active reservations right now. New requests will appear here."
                  : activeStatus === "past"
                    ? "No past reservations found."
                    : "Nothing matches this filter right now."}
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
