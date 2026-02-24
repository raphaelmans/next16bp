"use client";

import { Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/common/format";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useQueryReservationGroupDetail } from "@/features/reservation/hooks";

const GROUP_DETAIL_REFETCH_INTERVAL_MS = 15_000;

type ReservationGroupDetailPageProps = {
  reservationGroupId: string;
};

export default function ReservationGroupDetailPage({
  reservationGroupId,
}: ReservationGroupDetailPageProps) {
  const { data, isLoading } = useQueryReservationGroupDetail(
    reservationGroupId,
    GROUP_DETAIL_REFETCH_INTERVAL_MS,
  );

  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[320px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reservation group not found</h1>
          <Link
            href={appRoutes.reservations.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            View all reservations
          </Link>
        </div>
      </Container>
    );
  }

  const payableAwaitingItems = data.items.filter(
    (item) => item.totalPriceCents > 0 && item.status === "AWAITING_PAYMENT",
  );
  const canPayGroup = payableAwaitingItems.length > 0;
  const totalLabel = formatCurrency(
    data.reservationGroup.totalPriceCents,
    data.reservationGroup.currency,
  );
  const firstReservationId = data.items[0]?.reservationId ?? null;

  const handleOpenChat = () => {
    if (!firstReservationId) return;
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId: firstReservationId,
          reservationGroupId,
          source: "reservation-group-detail",
        },
      }),
    );
  };

  return (
    <Container className="py-6">
      <PageHeader
        title="Reservation Group"
        breadcrumbs={[
          { label: "My Reservations", href: appRoutes.reservations.base },
          { label: "Group Details" },
        ]}
        backHref={appRoutes.reservations.base}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booked Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.items.map((item) => (
                <div
                  key={item.reservationId}
                  className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">
                      {item.place.name} - {item.court.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateShort(item.startTimeIso)} ·{" "}
                      {formatTimeRange(item.startTimeIso, item.endTimeIso)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <KudosStatusBadge
                      status={item.status as ReservationStatus}
                      size="sm"
                    />
                    <p className="font-medium">
                      {formatCurrency(item.totalPriceCents, item.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Items</span>
                <span>{data.statusSummary.totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payable Items</span>
                <span>{data.statusSummary.payableItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{totalLabel}</span>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                {canPayGroup ? (
                  <Button asChild>
                    <Link
                      href={appRoutes.reservations.groupPayment(
                        reservationGroupId,
                      )}
                    >
                      Complete Payment
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" onClick={handleOpenChat}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Owner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
