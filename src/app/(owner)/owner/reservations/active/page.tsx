"use client";

import { differenceInSeconds, format } from "date-fns";
import { Clock, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogout, useSession } from "@/features/auth";
import {
  ConfirmDialog,
  OwnerNavbar,
  OwnerSidebar,
  PlaceCourtFilter,
  RejectModal,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  OWNER_UNRESOLVED_REFRESH_INTERVAL_SECONDS,
  type Reservation,
  useAcceptReservation,
  useConfirmReservation,
  useOwnerCourtFilter,
  useOwnerCourts,
  useOwnerOrganization,
  useOwnerPlaceFilter,
  useOwnerPlaces,
  useOwnerReservations,
  useRejectReservation,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type ActiveFilter = "all" | "awaiting" | "marked";

export default function OwnerActiveReservationsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { organization, organizations } = useOwnerOrganization();
  const { data: places = [] } = useOwnerPlaces(organization?.id ?? null);
  const { data: courts = [] } = useOwnerCourts(organization?.id ?? null);
  const { placeId, setPlaceId } = useOwnerPlaceFilter();
  const { courtId, setCourtId } = useOwnerCourtFilter();
  const [filter, setFilter] = React.useState<ActiveFilter>("all");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);

  const confirmTitle =
    selectedReservation?.reservationStatus === "CREATED"
      ? "Accept Reservation"
      : "Confirm Payment";
  const confirmLabel =
    selectedReservation?.reservationStatus === "CREATED" ? "Accept" : "Confirm";
  const now = React.useMemo(() => Date.now(), []);
  const [tick, setTick] = React.useState(now);

  const viewAllHref = React.useMemo(() => {
    const params = new URLSearchParams();
    if (placeId) {
      params.set("placeId", placeId);
    }
    if (courtId) {
      params.set("courtId", courtId);
    }
    const suffix = params.toString();
    return suffix
      ? `${appRoutes.owner.reservations}?${suffix}`
      : appRoutes.owner.reservations;
  }, [courtId, placeId]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.reservationsActive,
    );
  };

  React.useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const {
    data: reservations = [],
    isLoading,
    isFetching,
  } = useOwnerReservations(organization?.id ?? null, {
    placeId: placeId || undefined,
    courtId: courtId || undefined,
    status: "all",
    refetchIntervalMs: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  });

  const acceptMutation = useAcceptReservation();
  const confirmMutation = useConfirmReservation();
  const rejectMutation = useRejectReservation();

  const handleRefresh = async () => {
    if (!organization?.id) return;
    setIsRefreshing(true);
    try {
      await utils.reservationOwner.getForOrganization.invalidate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeReservations = React.useMemo(() => {
    const filtered = reservations.filter((reservation) =>
      ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"].includes(
        reservation.reservationStatus,
      ),
    );

    if (filter === "awaiting") {
      return filtered.filter(
        (reservation) => reservation.reservationStatus === "AWAITING_PAYMENT",
      );
    }
    if (filter === "marked") {
      return filtered.filter(
        (reservation) =>
          reservation.reservationStatus === "PAYMENT_MARKED_BY_USER",
      );
    }
    return filtered;
  }, [filter, reservations]);

  const handleConfirm = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setConfirmOpen(true);
  };

  const handleReject = (
    reservation: Reservation,
    mode: "reject" | "cancel",
  ) => {
    setSelectedReservation(reservation);
    setRejectMode(mode);
    setRejectOpen(true);
  };

  const handleConfirmSubmit = () => {
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
          setConfirmOpen(false);
        },
        onError: () => {
          toast.error(errorMessage);
        },
      },
    );
  };

  const handleRejectSubmit = (reason: string) => {
    if (!selectedReservation) return;
    rejectMutation.mutate(
      { reservationId: selectedReservation.id, reason },
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

  const renderCountdown = (reservation: Reservation) => {
    if (!reservation.expiresAt) return null;
    const diffSeconds = Math.max(
      0,
      differenceInSeconds(new Date(reservation.expiresAt), tick),
    );
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

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
          title="Active Reservations"
          description="Monitor reservations awaiting payment or confirmation"
          breadcrumbs={[
            { label: "Owner", href: appRoutes.owner.base },
            { label: "Reservations", href: appRoutes.owner.reservations },
            { label: "Active" },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading || isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isRefreshing || isFetching ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          }
        />

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold">
                  Active Queue
                </h2>
                <p className="text-sm text-muted-foreground">
                  Updated every {OWNER_UNRESOLVED_REFRESH_INTERVAL_SECONDS}{" "}
                  seconds
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as ActiveFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active</SelectItem>
                    <SelectItem value="awaiting">Awaiting Payment</SelectItem>
                    <SelectItem value="marked">Payment Marked</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href={viewAllHref}>
                    View All Reservations
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Loading active reservations...
              </div>
            )}

            {!isLoading && activeReservations.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No active reservations. You&apos;re all caught up!
                </p>
              </div>
            )}

            <div className="space-y-3">
              {activeReservations.map((reservation) => {
                const isAwaiting =
                  reservation.reservationStatus === "AWAITING_PAYMENT";
                const countdown = renderCountdown(reservation);

                return (
                  <Card
                    key={reservation.id}
                    className={cn("border", isAwaiting && "border-warning/30")}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-heading font-semibold">
                            {reservation.playerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.courtName} · {reservation.startTime} -{" "}
                            {reservation.endTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-xs",
                              isAwaiting
                                ? "bg-warning/10 text-warning border border-warning/20"
                                : "bg-primary/10 text-primary border border-primary/20",
                            )}
                          >
                            {isAwaiting ? "Awaiting payment" : "Payment marked"}
                          </Badge>
                          {isAwaiting && countdown && (
                            <Badge className="bg-muted text-muted-foreground border border-border">
                              <Clock className="mr-1 h-3 w-3" />
                              {countdown} left
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Created{" "}
                          {reservation.createdAt
                            ? format(
                                new Date(reservation.createdAt),
                                "MMM d, h:mm a",
                              )
                            : "--"}
                        </span>
                        <span>•</span>
                        <span>
                          {formatCurrency(
                            reservation.amountCents,
                            reservation.currency,
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={appRoutes.owner.reservationDetail(
                              reservation.id,
                            )}
                          >
                            View Reservation
                          </Link>
                        </Button>
                        {isAwaiting ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(reservation, "cancel")}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleConfirm(reservation)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleReject(reservation, "reject")
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSubmit}
        isLoading={confirmMutation.isPending || acceptMutation.isPending}
        title={confirmTitle}
        confirmLabel={confirmLabel}
      />

      <RejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onReject={handleRejectSubmit}
        isLoading={rejectMutation.isPending}
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
