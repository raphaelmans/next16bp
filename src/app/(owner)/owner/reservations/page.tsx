"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  ConfirmDialog,
  PlaceCourtFilter,
  RejectModal,
  ReservationAlertsPanel,
  ReservationsTable,
} from "@/features/owner/components";
import {
  useOwnerCourtFilter,
  useOwnerCourts,
  useOwnerOrganization,
  useOwnerPlaceFilter,
  useOwnerPlaces,
} from "@/features/owner/hooks";
import { useOrganizationPaymentMethods } from "@/features/owner/hooks/use-organization-payment-methods";
import {
  type Reservation,
  useAcceptReservation,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
} from "@/features/owner/hooks/use-owner-reservations";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/shared/lib/section-hashes";
import { trpc } from "@/trpc/client";

type TabValue = "pending" | "upcoming" | "past" | "cancelled";

type PendingFilter =
  | "all"
  | "needs-acceptance"
  | "awaiting-payment"
  | "payment-marked";

const PENDING_STATUSES = new Set([
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
]);

/**
 * Format price in Philippine Peso
 */
function formatPrice(amountCents: number, currency: string = "PHP"): string {
  if (amountCents === 0) return "Free";
  const amount = amountCents / 100;
  if (currency === "PHP") {
    return `₱${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Empty state component
 */
function ReservationsEmptyState({ type }: { type: TabValue | "all" }) {
  const config = {
    all: {
      icon: CalendarIcon,
      title: "No reservations yet",
      description:
        "When players book your courts, reservations will appear here.",
    },
    pending: {
      icon: CheckCircle,
      title: "Inbox cleared",
      description:
        "All caught up! No reservations need your attention right now.",
    },
    upcoming: {
      icon: CalendarIcon,
      title: "No upcoming reservations",
      description: "No confirmed bookings scheduled for the future.",
    },
    past: {
      icon: Clock,
      title: "No past reservations",
      description: "Completed bookings will appear here.",
    },
    cancelled: {
      icon: XCircle,
      title: "No cancelled reservations",
      description: "Cancelled or rejected bookings will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}

export default function OwnerReservationsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Get organization and courts from hooks
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: places = [] } = useOwnerPlaces(organization?.id ?? null);
  const { data: courts = [] } = useOwnerCourts(organization?.id ?? null);

  // Filters state
  const { placeId, setPlaceId } = useOwnerPlaceFilter();
  const { courtId, setCourtId } = useOwnerCourtFilter();
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState<Date>();
  const [dateTo, setDateTo] = React.useState<Date>();
  const [activeTab, setActiveTab] = React.useState<TabValue>("pending");
  const [pendingFilter, setPendingFilter] =
    React.useState<PendingFilter>("all");

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [paidOfflineDialogOpen, setPaidOfflineDialogOpen] =
    React.useState(false);
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);
  const confirmTitle =
    selectedReservation?.reservationStatus === "CREATED"
      ? "Accept Reservation"
      : "Confirm Payment";
  const confirmLabel =
    selectedReservation?.reservationStatus === "CREATED" ? "Accept" : "Confirm";

  const { data: reservations = [], isLoading } = useOwnerReservations(
    organization?.id ?? null,
    {
      placeId: placeId || undefined,
      courtId: courtId || undefined,
      status: "all",
      search: search || undefined,
      dateFrom,
      dateTo,
    },
  );
  const acceptMutation = useAcceptReservation();
  const confirmMutation = useConfirmReservation();
  const rejectMutation = useRejectReservation();
  const confirmPaidOfflineMutation =
    trpc.reservationOwner.confirmPaidOffline.useMutation({
      onSuccess: () => {
        void utils.reservationOwner.getForOrganization.invalidate();
        void utils.reservationOwner.getPendingCount.invalidate();
      },
    });

  const { data: paymentMethodsData } = useOrganizationPaymentMethods(
    organization?.id,
  );
  const paymentMethods = paymentMethodsData?.methods ?? [];
  const activePaymentMethods = paymentMethods.filter((m) => m.isActive);
  const defaultPaymentMethod = activePaymentMethods.find((m) => m.isDefault);

  const paidOfflineFormSchema = z.object({
    paymentMethodId: z.string().min(1, "Payment method is required"),
    paymentReference: z.string().min(1, "Reference is required").max(100),
  });
  type PaidOfflineFormValues = z.infer<typeof paidOfflineFormSchema>;
  const paidOfflineForm = useForm<PaidOfflineFormValues>({
    resolver: zodResolver(paidOfflineFormSchema),
    defaultValues: { paymentMethodId: "", paymentReference: "" },
  });

  const handleRefresh = async () => {
    if (!organization?.id) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const reservationGroups = React.useMemo(() => {
    const now = new Date();

    const parseDate = (value: string | null | undefined) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getStartTime = (reservation: Reservation) =>
      parseDate(reservation.slotStartTime ?? reservation.createdAt);

    const getEndTime = (reservation: Reservation) =>
      parseDate(reservation.slotEndTime ?? reservation.createdAt);

    const pending = reservations.filter((reservation) =>
      PENDING_STATUSES.has(reservation.reservationStatus),
    );
    const needsAcceptance = pending.filter(
      (reservation) => reservation.reservationStatus === "CREATED",
    );
    const awaitingPayment = pending.filter(
      (reservation) => reservation.reservationStatus === "AWAITING_PAYMENT",
    );
    const paymentMarked = pending.filter(
      (reservation) =>
        reservation.reservationStatus === "PAYMENT_MARKED_BY_USER",
    );

    const pendingFiltered = (() => {
      switch (pendingFilter) {
        case "needs-acceptance":
          return needsAcceptance;
        case "awaiting-payment":
          return awaitingPayment;
        case "payment-marked":
          return paymentMarked;
        default:
          return pending;
      }
    })();

    const pendingPriority: Record<string, number> = {
      PAYMENT_MARKED_BY_USER: 0,
      CREATED: 1,
      AWAITING_PAYMENT: 2,
    };

    const pendingSorted = [...pendingFiltered].sort((a, b) => {
      const priority =
        (pendingPriority[a.reservationStatus] ?? 3) -
        (pendingPriority[b.reservationStatus] ?? 3);
      if (priority !== 0) return priority;
      const aStart = getStartTime(a)?.getTime() ?? 0;
      const bStart = getStartTime(b)?.getTime() ?? 0;
      return aStart - bStart;
    });

    const confirmed = reservations.filter(
      (reservation) => reservation.reservationStatus === "CONFIRMED",
    );

    const upcoming = confirmed
      .filter((reservation) => {
        const endTime = getEndTime(reservation);
        return !endTime || endTime >= now;
      })
      .sort((a, b) => {
        const aStart = getStartTime(a)?.getTime() ?? 0;
        const bStart = getStartTime(b)?.getTime() ?? 0;
        return aStart - bStart;
      });

    const past = confirmed
      .filter((reservation) => {
        const endTime = getEndTime(reservation);
        return endTime ? endTime < now : false;
      })
      .sort((a, b) => {
        const aStart = getStartTime(a)?.getTime() ?? 0;
        const bStart = getStartTime(b)?.getTime() ?? 0;
        return bStart - aStart;
      });

    const cancelled = reservations.filter(
      (reservation) =>
        reservation.reservationStatus === "CANCELLED" ||
        reservation.reservationStatus === "EXPIRED",
    );

    return {
      groups: {
        pending: pendingSorted,
        upcoming,
        past,
        cancelled,
      },
      tabCounts: {
        pending: pending.length,
        upcoming: upcoming.length,
        past: past.length,
        cancelled: cancelled.length,
      },
      pendingCounts: {
        all: pending.length,
        needsAcceptance: needsAcceptance.length,
        awaitingPayment: awaitingPayment.length,
        paymentMarked: paymentMarked.length,
      },
    };
  }, [pendingFilter, reservations]);

  const tabCounts = reservationGroups.tabCounts;
  const pendingCounts = reservationGroups.pendingCounts;

  const tabConfig: { value: TabValue; label: string }[] = [
    { value: "pending", label: "Inbox" },
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const pendingFilterOptions: {
    value: PendingFilter;
    label: string;
    count: number;
  }[] = [
    { value: "all", label: "All", count: pendingCounts.all },
    {
      value: "needs-acceptance",
      label: "Needs acceptance",
      count: pendingCounts.needsAcceptance,
    },
    {
      value: "awaiting-payment",
      label: "Awaiting payment",
      count: pendingCounts.awaitingPayment,
    },
    {
      value: "payment-marked",
      label: "Payment marked",
      count: pendingCounts.paymentMarked,
    },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.reservations);
  };

  const handleConfirmClick = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setConfirmDialogOpen(true);
    }
  };

  const handlePaidOfflineClick = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      paidOfflineForm.reset({
        paymentMethodId: defaultPaymentMethod?.id ?? "",
        paymentReference: "",
      });
      setPaidOfflineDialogOpen(true);
    }
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
          toast.success("Reservation confirmed as paid offline");
          setPaidOfflineDialogOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to confirm offline payment");
        },
      },
    );
  };

  const handleRejectClick = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setRejectModalOpen(true);
    }
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
      { reservationId: selectedReservation.id },
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
    rejectMutation.mutate(
      { reservationId: selectedReservation.id, reason },
      {
        onSuccess: () => {
          toast.success("Booking rejected");
          setRejectModalOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to reject booking");
        },
      },
    );
  };

  // Show loading state while organization loads
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
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
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
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Reservations
            </h1>
            <p className="text-muted-foreground">
              Manage bookings for your courts
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <PlaceCourtFilter
            places={places}
            courts={courts}
            placeId={placeId}
            courtId={courtId}
            onPlaceChange={(value) => setPlaceId(value === "all" ? "" : value)}
            onCourtChange={(value) => setCourtId(value === "all" ? "" : value)}
          />

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  disabled={(date) => (dateFrom ? date < dateFrom : false)}
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search player name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList>
            {tabConfig.map((tabItem) => {
              const count = tabCounts[tabItem.value];
              const accessibleLabel =
                count > 0 ? `${tabItem.label}, ${count}` : tabItem.label;
              return (
                <TabsTrigger
                  key={tabItem.value}
                  value={tabItem.value}
                  className="gap-2"
                  aria-label={accessibleLabel}
                >
                  {tabItem.label}
                  {count > 0 ? (
                    <Badge
                      variant={
                        activeTab === tabItem.value ? "default" : "secondary"
                      }
                      className="ml-1"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabConfig.map((tabItem) => {
            const tabReservations = reservationGroups.groups[tabItem.value];
            const showPendingFilters = tabItem.value === "pending";

            return (
              <TabsContent
                key={tabItem.value}
                value={tabItem.value}
                className="mt-6"
                forceMount
              >
                {showPendingFilters && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {pendingFilterOptions.map((option) => {
                      const isActive = pendingFilter === option.value;
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          variant={isActive ? "secondary" : "ghost"}
                          className="gap-2"
                          aria-pressed={isActive}
                          onClick={() => setPendingFilter(option.value)}
                        >
                          {option.label}
                          {option.count > 0 ? (
                            <Badge variant="outline" className="h-5 px-1.5">
                              {option.count}
                            </Badge>
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : tabReservations.length === 0 ? (
                  <ReservationsEmptyState type={tabItem.value} />
                ) : (
                  <ReservationsTable
                    reservations={tabReservations}
                    onConfirm={handleConfirmClick}
                    onConfirmPaidOffline={handlePaidOfflineClick}
                    onReject={handleRejectClick}
                    isLoading={
                      confirmMutation.isPending ||
                      acceptMutation.isPending ||
                      rejectMutation.isPending ||
                      confirmPaidOfflineMutation.isPending
                    }
                  />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isLoading={confirmMutation.isPending || acceptMutation.isPending}
        title={confirmTitle}
        confirmLabel={confirmLabel}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
        dateTime={
          selectedReservation
            ? `${format(new Date(selectedReservation.date), "MMM d, yyyy")} at ${selectedReservation.startTime} - ${selectedReservation.endTime} for ${formatPrice(selectedReservation.amountCents, selectedReservation.currency)}`
            : undefined
        }
      />

      {/* Reject Modal */}
      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        onReject={handleReject}
        isLoading={rejectMutation.isPending}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
      />

      {/* Paid Offline Dialog */}
      <Dialog
        open={paidOfflineDialogOpen}
        onOpenChange={setPaidOfflineDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm paid offline</DialogTitle>
            <DialogDescription>
              Confirm that {selectedReservation?.playerName} has paid offline
              for {selectedReservation?.courtName}. This will skip the payment
              flow and mark the reservation as confirmed.
            </DialogDescription>
          </DialogHeader>
          {activePaymentMethods.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  You need at least one active payment method to confirm offline
                  payments.
                </p>
                <Button asChild>
                  <a
                    href={`${appRoutes.owner.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`}
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
                  options={activePaymentMethods.map((m) => ({
                    value: m.id,
                    label: `${m.provider} — ${m.accountName}${m.isDefault ? " (Default)" : ""}`,
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
                  Confirm payment
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
