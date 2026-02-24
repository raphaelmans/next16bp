"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import {
  useMutAcceptReservation,
  useMutConfirmReservation,
  useMutRejectReservation,
  useQueryOwnerOrganization,
  useQueryReservationGroupDetail,
} from "@/features/owner/hooks";

const stageLabelMap: Record<string, string> = {
  CREATED: "Needs acceptance",
  AWAITING_PAYMENT: "Awaiting payment",
  PAYMENT_MARKED_BY_USER: "Payment marked",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

type OwnerReservationGroupDetailPageProps = {
  reservationGroupId: string;
};

export default function OwnerReservationGroupDetailPage({
  reservationGroupId,
}: OwnerReservationGroupDetailPageProps) {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { organization, organizations } = useQueryOwnerOrganization();
  const groupQuery = useQueryReservationGroupDetail(reservationGroupId);
  const acceptMutation = useMutAcceptReservation();
  const confirmMutation = useMutConfirmReservation();
  const rejectMutation = useMutRejectReservation();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );

  const reservations = groupQuery.data?.reservations ?? [];
  const firstReservation = reservations[0];
  const statuses = new Set(reservations.map((item) => item.status));
  const allCreated =
    reservations.length > 0 && statuses.size === 1 && statuses.has("CREATED");
  const allPaymentMarked =
    reservations.length > 0 &&
    statuses.size === 1 &&
    statuses.has("PAYMENT_MARKED_BY_USER");
  const canReject =
    reservations.length > 0 &&
    reservations.every((item) =>
      ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"].includes(
        item.status,
      ),
    );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.reservationGroupDetail(reservationGroupId),
    );
  };

  const handleConfirmSubmit = () => {
    if (!firstReservation) return;
    const mutation = allCreated ? acceptMutation : confirmMutation;
    const successMessage = allCreated
      ? "Reservation group accepted"
      : "Reservation group payment confirmed";
    const errorMessage = allCreated
      ? "Failed to accept reservation group"
      : "Failed to confirm reservation group payment";

    mutation.mutate(
      {
        reservationId: firstReservation.id,
        reservationGroupId,
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
    if (!firstReservation) return;
    rejectMutation.mutate(
      {
        reservationId: firstReservation.id,
        reservationGroupId,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(
            rejectMode === "cancel"
              ? "Reservation group cancelled"
              : "Reservation group rejected",
          );
          setRejectOpen(false);
        },
        onError: () => {
          toast.error("Failed to update reservation group");
        },
      },
    );
  };

  const totalAmountCents = reservations.reduce(
    (sum, item) => sum + (item.amountCents ?? 0),
    0,
  );
  const currency = reservations[0]?.currency ?? "PHP";

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
          title="Reservation Group Details"
          description="Manage grouped booking lifecycle in one action."
          breadcrumbs={[
            { label: "Reservations", href: appRoutes.owner.reservations },
            { label: "Group Details" },
          ]}
        />

        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={appRoutes.owner.reservationsActive}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Active Reservations
          </Link>
        </Button>

        {groupQuery.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading reservation group...
            </CardContent>
          </Card>
        ) : reservations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Reservation group not found.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Group Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{reservations.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">
                    {formatCurrency(totalAmountCents, currency)}
                  </span>
                </div>
                <div className="pt-2 flex flex-wrap gap-2">
                  {(allCreated || allPaymentMarked) && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmOpen(true)}
                    >
                      {allCreated
                        ? "Accept Reservation Group"
                        : "Confirm Group Payment"}
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setRejectMode(allCreated ? "reject" : "cancel");
                        setRejectOpen(true);
                      }}
                    >
                      {allCreated ? "Reject Group" : "Cancel Group"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grouped Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">{item.courtName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.slotStartTime} - {item.slotEndTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {stageLabelMap[item.status] ?? item.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(
                          item.amountCents ?? 0,
                          item.currency ?? "PHP",
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          allCreated ? "Accept Reservation Group" : "Confirm Group Payment"
        }
        description={
          allCreated
            ? "This will accept all reservations in the group at once."
            : "This will confirm all payment-marked reservations in the group."
        }
        confirmLabel={allCreated ? "Accept Group" : "Confirm Group"}
        onConfirm={handleConfirmSubmit}
        isLoading={acceptMutation.isPending || confirmMutation.isPending}
      />

      <RejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={
          rejectMode === "cancel"
            ? "Cancel Reservation Group"
            : "Reject Reservation Group"
        }
        submitLabel={rejectMode === "cancel" ? "Cancel Group" : "Reject Group"}
        onReject={handleRejectSubmit}
        isLoading={rejectMutation.isPending}
      />
    </AppShell>
  );
}
