"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInSeconds, format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShortInTimeZone,
  formatRelativeFrom,
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
import { Calendar } from "@/components/ui/calendar";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useMutAcceptReservation,
  useMutCancelReservation,
  useMutConfirmReservation,
  useMutOwnerConfirmPaidOffline,
  useMutRejectReservation,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerCourts,
  useQueryOwnerOrganization,
  useQueryOwnerPlaces,
  useQueryOwnerReservationHistoryList,
  useQueryOwnerReservationInbox,
  useQueryOwnerReservationSchedule,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

type ReservationsView = "inbox" | "schedule" | "history";
type HistoryFilter = "completed" | "cancelled" | "expired";
type InboxSectionKey =
  | "payment-marked"
  | "needs-acceptance"
  | "awaiting-payment";

const VIEW_PARAM = "view";
const SEARCH_PARAM = "q";
const DATE_FROM_PARAM = "from";
const DATE_TO_PARAM = "to";
const HISTORY_PARAM = "history";
const HISTORY_PAGE_SIZE = 20;

const HISTORY_STATUS_MAP: Record<
  HistoryFilter,
  {
    statuses: Reservation["reservationStatus"][];
    timeBucket?: "past";
    label: string;
  }
> = {
  completed: {
    statuses: ["CONFIRMED"],
    timeBucket: "past",
    label: "Completed",
  },
  cancelled: {
    statuses: ["CANCELLED"],
    label: "Cancelled",
  },
  expired: {
    statuses: ["EXPIRED"],
    label: "Expired",
  },
};

const INBOX_SECTIONS: {
  key: InboxSectionKey;
  label: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    key: "payment-marked",
    label: "Payment marked",
    description: "Payments awaiting your confirmation.",
    emptyTitle: "No payments to confirm",
    emptyDescription: "New payment proofs will appear here.",
  },
  {
    key: "needs-acceptance",
    label: "Needs acceptance",
    description: "New booking requests that need a decision.",
    emptyTitle: "No new booking requests",
    emptyDescription: "Fresh requests will land here first.",
  },
  {
    key: "awaiting-payment",
    label: "Awaiting payment",
    description: "Accepted bookings waiting on the player.",
    emptyTitle: "Nothing is waiting on payment",
    emptyDescription: "Accepted bookings will show here until players pay.",
  },
];

const VIEW_OPTIONS: { value: ReservationsView; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "schedule", label: "Schedule" },
  { value: "history", label: "History" },
];

const paidOfflineFormSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().min(1, "Reference is required").max(100),
});

type PaidOfflineFormValues = z.infer<typeof paidOfflineFormSchema>;

function parseDayKey(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function isValidView(value: string | null): value is ReservationsView {
  return value === "inbox" || value === "schedule" || value === "history";
}

function isValidHistoryFilter(value: string | null): value is HistoryFilter {
  return value === "completed" || value === "cancelled" || value === "expired";
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getReservationStartMs(reservation: Reservation) {
  return (
    parseDate(reservation.slotStartTime ?? reservation.createdAt)?.getTime() ??
    0
  );
}

function getReservationEndMs(reservation: Reservation) {
  return (
    parseDate(reservation.slotEndTime ?? reservation.createdAt)?.getTime() ?? 0
  );
}

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

function getReservationExpiresLabel(
  reservation: Reservation,
  nowMs: number,
): string | null {
  if (!reservation.expiresAt) return null;
  const expiresAt = parseDate(reservation.expiresAt);
  if (!expiresAt) return null;

  if (reservation.reservationStatus === "EXPIRED") {
    return `Expired ${format(expiresAt, "MMM d, h:mm a")}`;
  }

  const secondsRemaining = Math.max(0, differenceInSeconds(expiresAt, nowMs));
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}m ${seconds}s left`;
}

function ReservationsEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Empty className="border-0 bg-muted/20 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function InboxReservationCard({
  reservation,
  nowMs,
  isLoading,
  onConfirm,
  onReject,
  onPaidOffline,
}: {
  reservation: Reservation;
  nowMs: number;
  isLoading?: boolean;
  onConfirm: (reservationId: string) => void;
  onReject: (reservation: Reservation, mode: "reject" | "cancel") => void;
  onPaidOffline: (reservationId: string) => void;
}) {
  const isCreated = reservation.reservationStatus === "CREATED";
  const isAwaitingPayment =
    reservation.reservationStatus === "AWAITING_PAYMENT";
  const stageLabel = isCreated
    ? "Needs acceptance"
    : isAwaitingPayment
      ? "Awaiting payment"
      : "Payment marked";
  const stageClassName = isCreated
    ? "bg-warning-light text-warning border-warning/20"
    : isAwaitingPayment
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-primary/10 text-primary border-primary/20";
  const expiryLabel = getReservationExpiresLabel(reservation, nowMs);

  return (
    <Card className="gap-4 border-border/80 shadow-none">
      <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-heading">
              {reservation.playerName}
            </CardTitle>
            <Badge variant="outline" className={stageClassName}>
              {stageLabel}
            </Badge>
            {reservation.isGroupPrimary && reservation.groupItemCount ? (
              <Badge variant="secondary">
                Group booking · {reservation.groupItemCount}
              </Badge>
            ) : null}
          </div>
          <CardDescription className="text-sm">
            {reservation.courtName}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {formatReservationDate(reservation)} ·{" "}
              {formatReservationTimeRange(reservation)}
            </span>
            <span>{reservation.playerPhone || reservation.playerEmail}</span>
            <span>
              {formatCurrency(reservation.amountCents, reservation.currency)}
            </span>
          </div>
        </div>
        <div className="space-y-1 text-left text-sm sm:text-right">
          <p className="font-medium text-foreground">
            {formatCurrency(reservation.amountCents, reservation.currency)}
          </p>
          {expiryLabel ? (
            <p className="text-muted-foreground">{expiryLabel}</p>
          ) : null}
          <p className="text-muted-foreground">
            Created {formatRelativeFrom(reservation.createdAt, nowMs)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {reservation.paymentProof ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            Payment proof attached
            {reservation.paymentProof.referenceNumber
              ? ` · Ref ${reservation.paymentProof.referenceNumber}`
              : ""}
          </div>
        ) : null}

        {reservation.isGroupPrimary && reservation.groupItems?.length ? (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">Grouped items</p>
            <div className="mt-2 space-y-2">
              {reservation.groupItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>{item.courtName}</span>
                  <span className="text-muted-foreground">
                    {formatReservationDate(item)} ·{" "}
                    {formatReservationTimeRange(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {!isAwaitingPayment ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfirm(reservation.id)}
              disabled={isLoading}
            >
              {isCreated ? "Accept" : "Confirm"}
            </Button>
          ) : null}

          {isCreated && reservation.amountCents > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaidOffline(reservation.id)}
              disabled={isLoading}
            >
              Paid & Confirmed
            </Button>
          ) : null}

          {isAwaitingPayment ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onReject(reservation, "cancel")}
              disabled={isLoading}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onReject(reservation, "reject")}
              disabled={isLoading}
            >
              Reject
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link
              href={appRoutes.organization.reservationDetail(reservation.id)}
            >
              View details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerReservationsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { invalidateOwnerReservationsOverview } = useModOwnerInvalidation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [nowMs, setNowMs] = React.useState(() => Date.now());

  const [viewParam, setViewParam] = useQueryState(
    VIEW_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    SEARCH_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );
  const [dateFromQuery, setDateFromQuery] = useQueryState(
    DATE_FROM_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );
  const [dateToQuery, setDateToQuery] = useQueryState(
    DATE_TO_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );
  const [historyParam, setHistoryParam] = useQueryState(
    HISTORY_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const activeView = isValidView(viewParam) ? viewParam : "inbox";
  const historyFilter = isValidHistoryFilter(historyParam)
    ? historyParam
    : "completed";

  const dateFrom = parseDayKey(dateFromQuery);
  const dateTo = parseDayKey(dateToQuery);

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

  const [historyPage, setHistoryPage] = React.useState(0);
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

  const inboxQuery = useQueryOwnerReservationInbox(organization?.id ?? null, {
    placeId: placeId || undefined,
    courtId: courtId || undefined,
    search,
    dateFrom,
    dateTo,
    refetchIntervalMs: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
    enabled: activeView === "inbox",
  });

  const scheduleQuery = useQueryOwnerReservationSchedule(
    organization?.id ?? null,
    {
      placeId: placeId || undefined,
      courtId: courtId || undefined,
      search,
      dateFrom,
      dateTo,
      enabled: activeView === "schedule",
    },
  );

  const historyScope = HISTORY_STATUS_MAP[historyFilter];
  const historyQuery = useQueryOwnerReservationHistoryList(
    organization?.id ?? null,
    {
      placeId: placeId || undefined,
      courtId: courtId || undefined,
      search,
      dateFrom,
      dateTo,
      statuses: historyScope.statuses,
      timeBucket: historyScope.timeBucket,
      limit: HISTORY_PAGE_SIZE,
      offset: historyPage * HISTORY_PAGE_SIZE,
      enabled: activeView === "history",
    },
  );

  useModOwnerReservationRealtimeStream({
    enabled: Boolean(organization?.id) && activeView === "inbox",
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

  React.useEffect(() => {
    if (activeView !== "inbox") return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeView]);

  const historyResetKey = [
    placeId,
    courtId,
    searchQuery ?? "",
    dateFromQuery ?? "",
    dateToQuery ?? "",
    historyFilter,
  ].join("::");

  React.useEffect(() => {
    if (!historyResetKey) return;
    setHistoryPage(0);
  }, [historyResetKey]);

  const inboxReservations = React.useMemo(() => {
    const reservations = inboxQuery.data ?? [];
    const priority: Record<InboxSectionKey, Reservation["reservationStatus"]> =
      {
        "payment-marked": "PAYMENT_MARKED_BY_USER",
        "needs-acceptance": "CREATED",
        "awaiting-payment": "AWAITING_PAYMENT",
      };

    return INBOX_SECTIONS.map((section) => ({
      ...section,
      reservations: reservations
        .filter(
          (reservation) =>
            reservation.reservationStatus === priority[section.key],
        )
        .sort((a, b) => getReservationStartMs(a) - getReservationStartMs(b)),
    }));
  }, [inboxQuery.data]);

  const inboxCounts = React.useMemo(() => {
    const reservations = inboxQuery.data ?? [];
    const needsAcceptance = reservations.filter(
      (reservation) => reservation.reservationStatus === "CREATED",
    ).length;
    const paymentMarked = reservations.filter(
      (reservation) =>
        reservation.reservationStatus === "PAYMENT_MARKED_BY_USER",
    ).length;
    const awaitingPayment = reservations.filter(
      (reservation) => reservation.reservationStatus === "AWAITING_PAYMENT",
    ).length;

    return {
      total: reservations.length,
      needsAcceptance,
      paymentMarked,
      awaitingPayment,
    };
  }, [inboxQuery.data]);

  const scheduleReservations = React.useMemo(
    () =>
      [...(scheduleQuery.data ?? [])].sort(
        (a, b) => getReservationStartMs(a) - getReservationStartMs(b),
      ),
    [scheduleQuery.data],
  );

  const todayReservations = React.useMemo(
    () =>
      scheduleReservations.filter(
        (reservation) =>
          reservation.date ===
          getZonedDayKey(new Date(), reservation.placeTimeZone),
      ),
    [scheduleReservations],
  );

  const upcomingReservations = React.useMemo(
    () =>
      scheduleReservations.filter(
        (reservation) =>
          reservation.date !==
          getZonedDayKey(new Date(), reservation.placeTimeZone),
      ),
    [scheduleReservations],
  );

  const historyReservations = React.useMemo(() => {
    const reservations = [...(historyQuery.data ?? [])];
    if (historyFilter === "completed") {
      return reservations.sort(
        (a, b) => getReservationEndMs(b) - getReservationEndMs(a),
      );
    }
    return reservations.sort(
      (a, b) =>
        (parseDate(b.createdAt)?.getTime() ?? 0) -
        (parseDate(a.createdAt)?.getTime() ?? 0),
    );
  }, [historyFilter, historyQuery.data]);

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
    const reservation = inboxQuery.data?.find(
      (item) => item.id === reservationId,
    );
    if (!reservation) return;
    setSelectedReservation(reservation);
    setConfirmDialogOpen(true);
  };

  const handleOpenReject = (
    reservation: Reservation,
    mode: "reject" | "cancel",
  ) => {
    setSelectedReservation(reservation);
    setRejectMode(mode);
    setRejectModalOpen(true);
  };

  const handleOpenPaidOffline = (reservationId: string) => {
    const reservation = inboxQuery.data?.find(
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
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-20 w-full" />
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
    >
      <div className="space-y-6">
        <PageHeader
          title="Reservations"
          description="Clear urgent requests fast, then switch to schedule or history when you need to browse."
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

        {activeView === "inbox" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="gap-3 shadow-none">
              <CardHeader className="gap-1">
                <CardDescription>Ready now</CardDescription>
                <CardTitle className="font-heading text-2xl">
                  {inboxCounts.paymentMarked + inboxCounts.needsAcceptance}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Payment confirmations and fresh booking requests.
              </CardContent>
            </Card>
            <Card className="gap-3 shadow-none">
              <CardHeader className="gap-1">
                <CardDescription>Awaiting player</CardDescription>
                <CardTitle className="font-heading text-2xl">
                  {inboxCounts.awaitingPayment}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Accepted reservations that still need payment.
              </CardContent>
            </Card>
            <Card className="gap-3 shadow-none">
              <CardHeader className="gap-1">
                <CardDescription>Queue size</CardDescription>
                <CardTitle className="font-heading text-2xl">
                  {inboxCounts.total}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Unresolved reservations currently in your inbox.
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="sticky top-3 z-10 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col gap-4">
            <Tabs
              value={activeView}
              onValueChange={(value) => {
                void setViewParam(value);
              }}
            >
              <TabsList>
                {VIEW_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
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

              <div className="flex flex-wrap gap-2">
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
                      onSelect={(value) =>
                        void setDateFromQuery(
                          value ? format(value, "yyyy-MM-dd") : null,
                        )
                      }
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
                      onSelect={(value) =>
                        void setDateToQuery(
                          value ? format(value, "yyyy-MM-dd") : null,
                        )
                      }
                      disabled={(value) =>
                        dateFrom ? value < dateFrom : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                {(dateFromQuery || dateToQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void setDateFromQuery(null);
                      void setDateToQuery(null);
                    }}
                  >
                    Clear dates
                  </Button>
                )}
              </div>

              <div className="relative w-full xl:ml-auto xl:max-w-sm">
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
            </div>
          </div>
        </div>

        {activeView === "inbox" ? (
          <div className="space-y-6">
            {inboxQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : inboxCounts.total === 0 ? (
              <ReservationsEmptyState
                icon={CheckCircle2}
                title="Inbox cleared"
                description="All unresolved reservations are handled. New requests will appear here."
              />
            ) : (
              inboxReservations.map((section) => (
                <section key={section.key} className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        {section.label}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {section.reservations.length}
                    </Badge>
                  </div>

                  {section.reservations.length === 0 ? (
                    <ReservationsEmptyState
                      icon={Clock3}
                      title={section.emptyTitle}
                      description={section.emptyDescription}
                    />
                  ) : (
                    <div className="space-y-4">
                      {section.reservations.map((reservation) => (
                        <InboxReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          nowMs={nowMs}
                          isLoading={mutationIsPending}
                          onConfirm={handleOpenConfirm}
                          onReject={handleOpenReject}
                          onPaidOffline={handleOpenPaidOffline}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        ) : null}

        {activeView === "schedule" ? (
          <div>
            {scheduleQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : scheduleReservations.length === 0 ? (
              <ReservationsEmptyState
                icon={CalendarIcon}
                title="No upcoming reservations"
                description="Confirmed reservations for today and later will appear here."
              />
            ) : (
              <div className="space-y-6">
                <section className="space-y-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Today
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Confirmed reservations happening today.
                    </p>
                  </div>
                  {todayReservations.length === 0 ? (
                    <ReservationsEmptyState
                      icon={CalendarIcon}
                      title="Nothing booked today"
                      description="Today's confirmed reservations will appear here."
                    />
                  ) : (
                    <ReservationsTable reservations={todayReservations} />
                  )}
                </section>

                <section className="space-y-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Upcoming
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Future confirmed reservations across your venues.
                    </p>
                  </div>
                  {upcomingReservations.length === 0 ? (
                    <ReservationsEmptyState
                      icon={CalendarIcon}
                      title="No future bookings"
                      description="Future confirmed reservations will show here."
                    />
                  ) : (
                    <ReservationsTable reservations={upcomingReservations} />
                  )}
                </section>
              </div>
            )}
          </div>
        ) : null}

        {activeView === "history" ? (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(HISTORY_STATUS_MAP).map(([value, config]) => {
                const isActive = historyFilter === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => void setHistoryParam(value)}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {historyQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : historyReservations.length === 0 ? (
              <ReservationsEmptyState
                icon={History}
                title={`No ${historyScope.label.toLowerCase()} reservations`}
                description="Adjust your filters or date range to broaden the result set."
              />
            ) : (
              <div className="space-y-4">
                <ReservationsTable reservations={historyReservations} />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Page {historyPage + 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage === 0}
                      onClick={() =>
                        setHistoryPage((page) => Math.max(0, page - 1))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyReservations.length < HISTORY_PAGE_SIZE}
                      onClick={() => setHistoryPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
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
