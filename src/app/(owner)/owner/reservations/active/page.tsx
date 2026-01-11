"use client";

import { differenceInSeconds, format } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
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
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import { useOwnerOrganization } from "@/features/owner/hooks/use-owner-organization";
import {
  type Reservation,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
} from "@/features/owner/hooks/use-owner-reservations";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { formatCurrency } from "@/shared/lib/format";

type ActiveFilter = "all" | "awaiting" | "marked";

export default function OwnerActiveReservationsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const { organization, organizations } = useOwnerOrganization();
  const [filter, setFilter] = React.useState<ActiveFilter>("all");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);
  const now = React.useMemo(() => Date.now(), []);
  const [tick, setTick] = React.useState(now);

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

  const { data: reservations = [], isLoading } = useOwnerReservations(
    organization?.id ?? null,
    {
      status: "all",
      refetchIntervalMs: 15000,
    },
  );

  const confirmMutation = useConfirmReservation();
  const rejectMutation = useRejectReservation();

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
  }, [reservations, filter]);

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
    confirmMutation.mutate(
      { reservationId: selectedReservation.id },
      {
        onSuccess: () => {
          toast.success("Reservation confirmed");
          setConfirmOpen(false);
        },
        onError: () => {
          toast.error("Failed to confirm reservation");
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
        />

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold">
                  Active Queue
                </h2>
                <p className="text-sm text-muted-foreground">
                  Updated every 15 seconds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as ActiveFilter)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active</SelectItem>
                    <SelectItem value="awaiting">Awaiting Payment</SelectItem>
                    <SelectItem value="marked">Payment Marked</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" asChild>
                  <Link href={appRoutes.owner.reservations}>
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
        isLoading={confirmMutation.isPending}
        title="Confirm Reservation"
        confirmLabel="Confirm"
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
