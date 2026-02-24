"use client";

import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/common/format";
import { toast } from "@/common/toast";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import { TermsCheckbox } from "@/features/reservation/components/terms-checkbox";
import {
  useMutMarkPaymentGroup,
  useQueryReservationGroupDetail,
  useQueryReservationPaymentInfo,
} from "@/features/reservation/hooks";

type ReservationGroupPaymentPageProps = {
  reservationGroupId: string;
};

export default function ReservationGroupPaymentPage({
  reservationGroupId,
}: ReservationGroupPaymentPageProps) {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const groupQuery = useQueryReservationGroupDetail(reservationGroupId);
  const markPaymentGroup = useMutMarkPaymentGroup();

  const payableAwaitingItems = useMemo(() => {
    const items = groupQuery.data?.items ?? [];
    return items.filter(
      (item) => item.totalPriceCents > 0 && item.status === "AWAITING_PAYMENT",
    );
  }, [groupQuery.data?.items]);

  const firstPayableReservationId = payableAwaitingItems[0]?.reservationId;
  const paymentInfoQuery = useQueryReservationPaymentInfo(
    firstPayableReservationId ?? "",
    Boolean(firstPayableReservationId),
  );

  const expiresInMinutes = useMemo(() => {
    const expiries = payableAwaitingItems
      .map((item) =>
        item.expiresAtIso ? new Date(item.expiresAtIso).getTime() : null,
      )
      .filter((value): value is number => value !== null && value > Date.now());
    if (expiries.length === 0) return 15;
    const nextExpiry = Math.min(...expiries);
    return Math.max(1, Math.round((nextExpiry - Date.now()) / 60_000));
  }, [payableAwaitingItems]);

  const firstReservationId = groupQuery.data?.items[0]?.reservationId ?? null;

  const handleOpenChat = () => {
    if (!firstReservationId) return;
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId: firstReservationId,
          reservationGroupId,
          source: "reservation-group-payment",
        },
      }),
    );
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    try {
      await markPaymentGroup.mutateAsync({
        reservationGroupId,
        termsAccepted: true,
      });
      router.push(appRoutes.reservations.groupDetail(reservationGroupId));
    } catch {
      // handled in mutation hook
    }
  };

  if (groupQuery.isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[320px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!groupQuery.data) {
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

  if (payableAwaitingItems.length === 0) {
    return (
      <Container className="py-6">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                This reservation group does not have payable items awaiting
                payment.
              </p>
              <Button asChild className="w-full">
                <Link
                  href={appRoutes.reservations.groupDetail(reservationGroupId)}
                >
                  View Reservation Group
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const totalPayableCents = payableAwaitingItems.reduce(
    (sum, item) => sum + item.totalPriceCents,
    0,
  );
  const currency = payableAwaitingItems[0]?.currency ?? "PHP";

  return (
    <Container className="py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                appRoutes.reservations.groupDetail(reservationGroupId),
              )
            }
            className="-ml-2 mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Group Details
          </Button>
          <h1 className="text-2xl font-heading font-bold">
            Complete Group Payment
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit payment once for all payable items in this reservation group.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payable Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payableAwaitingItems.map((item) => (
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
                <p className="font-medium">
                  {formatCurrency(item.totalPriceCents, item.currency)}
                </p>
              </div>
            ))}

            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Due</span>
              <span className="text-lg font-semibold">
                {formatCurrency(totalPayableCents, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <PaymentInfoCard
          paymentMethods={paymentInfoQuery.data?.methods}
          expiresInMinutes={expiresInMinutes}
        />

        <Button variant="outline" onClick={handleOpenChat}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Message Owner
        </Button>

        <TermsCheckbox
          checked={termsAccepted}
          onCheckedChange={setTermsAccepted}
        />

        <Button
          className="w-full"
          size="lg"
          disabled={!termsAccepted || markPaymentGroup.isPending}
          onClick={handleSubmit}
        >
          {markPaymentGroup.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Group Payment"
          )}
        </Button>
      </div>
    </Container>
  );
}
