"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Clock, RefreshCw } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { toast } from "@/common/toast";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import {
  useModOwnerInvalidation,
  useModOwnerReservationRealtimeStream,
  useMutAcceptReservation,
  useMutCancelReservation,
  useMutConfirmReservation,
  useMutOwnerConfirmPaidOffline,
  useMutRejectReservation,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerOrganization,
  useQueryOwnerReservationEntity,
  useQueryOwnerReservationHistory,
  useQueryReservationLinkedDetail,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

const stageConfig = {
  CREATED: {
    label: "Needs acceptance",
    className: "bg-warning-light text-warning border-warning/20",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  PAYMENT_MARKED_BY_USER: {
    label: "Payment marked",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-success-light text-success border-success/20",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-destructive-light text-destructive border-destructive/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
} as const;

const eventLabelMap: Record<string, string> = {
  CREATED: "Reservation Created",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_MARKED_BY_USER: "Payment Marked",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const roleLabelMap: Record<string, string> = {
  PLAYER: "Player",
  OWNER: "Owner",
  SYSTEM: "System",
};

type OwnerReservationDetailPageProps = {
  reservationId: string;
};

type ReservationGroupDetailItem = {
  id: string;
  status: string;
  courtName?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
  amountCents?: number | null;
  currency?: string | null;
};

const paidOfflineFormSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().min(1, "Reference is required").max(100),
});

type PaidOfflineFormValues = z.infer<typeof paidOfflineFormSchema>;

export default function OwnerReservationDetailPage({
  reservationId,
}: OwnerReservationDetailPageProps) {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { invalidateOwnerReservationsOverview } = useModOwnerInvalidation();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const reservationQuery = useQueryOwnerReservationEntity(
    organization?.id ?? null,
    reservationId,
  );
  const reservation = reservationQuery.data;
  const isLoading = reservationQuery.isLoading;

  const historyQuery = useQueryOwnerReservationHistory({ reservationId });
  const history = historyQuery.data ?? [];
  const historyLoading = historyQuery.isLoading;

  useModOwnerReservationRealtimeStream({
    enabled: Boolean(organization?.id && reservationId),
    reservationIds: [reservationId],
  });

  const reservationGroupQuery = useQueryReservationLinkedDetail(reservationId);
  const reservationGroupItems = React.useMemo(
    () =>
      (
        (
          reservationGroupQuery.data as
            | { reservations?: ReservationGroupDetailItem[] }
            | undefined
        )?.reservations ?? []
      ).filter((item) => item.id !== reservation?.id),
    [reservation?.id, reservationGroupQuery.data],
  );
  const acceptMutation = useMutAcceptReservation();
  const confirmMutation = useMutConfirmReservation();
  const cancelMutation = useMutCancelReservation();
  const rejectMutation = useMutRejectReservation();
  const confirmPaidOfflineMutation = useMutOwnerConfirmPaidOffline({
    onSuccess: async (_data, variables) => {
      await invalidateOwnerReservationsOverview({
        reservationId:
          typeof variables === "object" &&
          variables !== null &&
          "reservationId" in variables
            ? String(variables.reservationId)
            : undefined,
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

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [paidOfflineOpen, setPaidOfflineOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );
  const paidOfflineForm = useForm<PaidOfflineFormValues>({
    resolver: zodResolver(paidOfflineFormSchema),
    defaultValues: {
      paymentMethodId: "",
      paymentReference: "",
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.reservationDetail(reservationId),
    );
  };

  const isCreated = reservation?.reservationStatus === "CREATED";
  const isAwaiting = reservation?.reservationStatus === "AWAITING_PAYMENT";
  const isMarked = reservation?.reservationStatus === "PAYMENT_MARKED_BY_USER";
  const canMarkPaidOffline = Boolean(
    isCreated && (reservation?.amountCents ?? 0) > 0,
  );
  const confirmTitle = isCreated ? "Accept Reservation" : "Confirm Payment";
  const confirmLabel = isCreated ? "Accept" : "Confirm";
  const isMutationPending =
    acceptMutation.isPending ||
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    rejectMutation.isPending ||
    confirmPaidOfflineMutation.isPending;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        invalidateOwnerReservationsOverview({ reservationId }),
        historyQuery.refetch(),
        reservationGroupQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!reservation) return;
    const isCreatedReservation = reservation.reservationStatus === "CREATED";
    const mutation = isCreatedReservation ? acceptMutation : confirmMutation;
    const successMessage = isCreatedReservation
      ? "Reservation accepted"
      : "Payment confirmed";
    const errorMessage = isCreatedReservation
      ? "Failed to accept reservation"
      : "Failed to confirm payment";

    mutation.mutate(
      {
        reservationId: reservation.id,
      },
      {
        onSuccess: () => {
          toast.success(successMessage);
          setConfirmOpen(false);
        },
        onError: () => {
          toast.error(errorMessage);
        },
      },
    );
  };

  const handleRejectSubmit = (reason: string) => {
    if (!reservation) return;
    const mutation = rejectMode === "cancel" ? cancelMutation : rejectMutation;

    mutation.mutate(
      {
        reservationId: reservation.id,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(
            rejectMode === "cancel"
              ? "Reservation cancelled"
              : "Reservation rejected",
          );
          setRejectOpen(false);
        },
        onError: () => {
          toast.error("Failed to update reservation");
        },
      },
    );
  };

  const handleOpenPaidOffline = () => {
    paidOfflineForm.reset({
      paymentMethodId: defaultPaymentMethod?.id ?? "",
      paymentReference: "",
    });
    setPaidOfflineOpen(true);
  };

  const handlePaidOfflineSubmit = (values: PaidOfflineFormValues) => {
    if (!reservation) return;

    confirmPaidOfflineMutation.mutate(
      {
        reservationId: reservation.id,
        paymentMethodId: values.paymentMethodId,
        paymentReference: values.paymentReference,
      },
      {
        onSuccess: () => {
          toast.success("Reservation marked as paid and confirmed");
          setPaidOfflineOpen(false);
        },
        onError: () => {
          toast.error("Failed to mark reservation as paid and confirmed");
        },
      },
    );
  };

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
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-48" />
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization ?? undefined}
          organizations={organizations ?? []}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? ""}
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
        <PageHeader
          title="Reservation Details"
          description="Review reservation status and take action"
          breadcrumbs={[
            {
              label: "Reservations",
              href: appRoutes.organization.reservations,
            },
            { label: "Details" },
          ]}
          backHref={appRoutes.organization.reservationsActive}
          backLabel="Back to Active Reservations"
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

        {isLoading && (
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !reservation && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Reservation not found.
            </CardContent>
          </Card>
        )}

        {reservation && (
          <>
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-heading font-semibold">
                    {reservation.playerName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {reservation.reservationGroupId ? (
                      <Badge variant="secondary" className="text-xs">
                        Group booking
                      </Badge>
                    ) : null}
                    <Badge
                      className={cn(
                        "text-xs",
                        stageConfig[reservation.reservationStatus]?.className,
                      )}
                    >
                      {stageConfig[reservation.reservationStatus]?.label ??
                        reservation.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reservation.courtName} · {reservation.startTime} -{" "}
                  {reservation.endTime}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Player Email</p>
                    <p className="font-medium">{reservation.playerEmail}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Player Phone</p>
                    <p className="font-medium">{reservation.playerPhone}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(
                        reservation.amountCents,
                        reservation.currency,
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {reservation.createdAt
                        ? format(
                            new Date(reservation.createdAt),
                            "MMM d, h:mm a",
                          )
                        : "--"}
                    </p>
                  </div>
                  {reservation.expiresAt && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        {format(
                          new Date(reservation.expiresAt),
                          "MMM d, h:mm a",
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {(isCreated || isAwaiting || isMarked) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {isAwaiting ? (
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setRejectMode("cancel");
                          setRejectOpen(true);
                        }}
                        disabled={isMutationPending}
                      >
                        Cancel Reservation
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => setConfirmOpen(true)}
                          disabled={isMutationPending}
                        >
                          {isCreated ? "Accept Reservation" : "Confirm Payment"}
                        </Button>
                        {canMarkPaidOffline ? (
                          <Button
                            variant="outline"
                            onClick={handleOpenPaidOffline}
                            disabled={isMutationPending}
                          >
                            Paid & Confirmed
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setRejectMode("reject");
                            setRejectOpen(true);
                          }}
                          disabled={isMutationPending}
                        >
                          Reject Reservation
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {reservation.reservationGroupId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Grouped Reservation Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservationGroupQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  ) : reservationGroupItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No additional grouped items found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reservationGroupItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium">
                              {item.courtName ?? "Venue"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.slotStartTime
                                ? format(
                                    new Date(item.slotStartTime),
                                    "MMM d, h:mm a",
                                  )
                                : "--"}{" "}
                              -{" "}
                              {item.slotEndTime
                                ? format(new Date(item.slotEndTime), "h:mm a")
                                : "--"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(
                                item.amountCents ?? 0,
                                item.currency ?? "PHP",
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stageConfig[
                                item.status as keyof typeof stageConfig
                              ]?.label ?? item.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-4">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((event, index) => {
                      const label =
                        eventLabelMap[event.toStatus] ?? event.toStatus;
                      const roleLabel =
                        roleLabelMap[event.triggeredByRole] ??
                        event.triggeredByRole;
                      const createdAt = event.createdAt
                        ? format(new Date(event.createdAt), "MMM d, h:mm a")
                        : "--";
                      return (
                        <div key={event.id ?? `${event.toStatus}-${index}`}>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              {index < history.length - 1 && (
                                <div className="w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="pb-4 space-y-1">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-muted-foreground">
                                {createdAt}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Role: {roleLabel}
                              </p>
                              {event.notes && (
                                <p className="text-xs text-muted-foreground">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSubmit}
        isLoading={acceptMutation.isPending || confirmMutation.isPending}
        title={confirmTitle}
        confirmLabel={confirmLabel}
      />

      <Dialog open={paidOfflineOpen} onOpenChange={setPaidOfflineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid & Confirmed</DialogTitle>
            <DialogDescription>
              Confirm that {reservation?.playerName} is paid and confirmed for{" "}
              {reservation?.courtName}. This skips the regular payment flow.
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
                  onClick={() => setPaidOfflineOpen(false)}
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
                  onClick={() => setPaidOfflineOpen(false)}
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

      <RejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onReject={handleRejectSubmit}
        isLoading={rejectMutation.isPending || cancelMutation.isPending}
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
    </AppShell>
  );
}
