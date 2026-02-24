"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/common/format";
import { toast } from "@/common/toast";
import { StandardFormProvider } from "@/components/form";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/features/reservation/components/countdown-timer";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import {
  PaymentProofForm,
  type PaymentProofFormValues,
  paymentProofFormSchema,
} from "@/features/reservation/components/payment-proof-form";
import { ReservationExpired } from "@/features/reservation/components/reservation-expired";
import { TermsCheckbox } from "@/features/reservation/components/terms-checkbox";
import {
  useModReservationPostPaymentWarmup,
  useMutAddPaymentProof,
  useMutMarkPayment,
  useMutMarkPaymentGroup,
  useMutUploadPaymentProof,
  useQueryReservationDetail,
  useQueryReservationGroupDetail,
  useQueryReservationPaymentInfo,
} from "@/features/reservation/hooks";

type ReservationPaymentPageProps = {
  reservationId: string;
};

export default function PaymentPage({
  reservationId,
}: ReservationPaymentPageProps) {
  const router = useRouter();
  const { warmupAfterPayment } = useModReservationPostPaymentWarmup();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const form = useForm<PaymentProofFormValues>({
    resolver: zodResolver(paymentProofFormSchema),
    mode: "onChange",
    defaultValues: {
      referenceNumber: "",
      notes: "",
      proofFile: null,
    },
  });

  const {
    reset,
    formState: { isSubmitting: formSubmitting },
  } = form;

  // Fetch reservation details
  const { data: reservationDetail, isLoading } =
    useQueryReservationDetail(reservationId);

  const reservation = reservationDetail?.reservation;
  const reservationGroupId = reservation?.groupId ?? null;

  // Group payment support
  const { data: groupData } = useQueryReservationGroupDetail(
    reservationGroupId ?? "",
  );
  const isGroupPayment = Boolean(reservationGroupId && groupData);
  const markPaymentGroup = useMutMarkPaymentGroup();

  const payableAwaitingItems = useMemo(() => {
    if (!groupData) return [];
    return groupData.items.filter(
      (item) => item.totalPriceCents > 0 && item.status === "AWAITING_PAYMENT",
    );
  }, [groupData]);

  const groupExpiresInMinutes = useMemo(() => {
    const expiries = payableAwaitingItems
      .map((item) =>
        item.expiresAtIso ? new Date(item.expiresAtIso).getTime() : null,
      )
      .filter((value): value is number => value !== null && value > Date.now());
    if (expiries.length === 0) return 15;
    const nextExpiry = Math.min(...expiries);
    return Math.max(1, Math.round((nextExpiry - Date.now()) / 60_000));
  }, [payableAwaitingItems]);

  const isChatEnabledForReservationStatus =
    reservation?.status === "CREATED" ||
    reservation?.status === "AWAITING_PAYMENT" ||
    reservation?.status === "PAYMENT_MARKED_BY_USER" ||
    reservation?.status === "CONFIRMED";

  // For individual payment, derive paymentInfo from the first payable item (or the reservation itself)
  const paymentInfoReservationId = isGroupPayment
    ? (payableAwaitingItems[0]?.reservationId ?? reservationId)
    : reservationId;
  const { data: paymentInfo } = useQueryReservationPaymentInfo(
    paymentInfoReservationId,
    reservation?.status === "AWAITING_PAYMENT" ||
      reservation?.status === "PAYMENT_MARKED_BY_USER",
  );

  const addPaymentProof = useMutAddPaymentProof();

  const uploadPaymentProof = useMutUploadPaymentProof();
  const markPayment = useMutMarkPayment();

  useEffect(() => {
    if (reservation?.expiresAt) {
      setIsExpired(new Date(reservation.expiresAt) < new Date());
    }
  }, [reservation?.expiresAt]);

  const handleMarkPaid = async (values: PaymentProofFormValues) => {
    try {
      const referenceNumber = values.referenceNumber?.trim() ?? "";
      const notes = values.notes?.trim() ?? "";
      const proofFile =
        values.proofFile instanceof File ? values.proofFile : null;

      if (!proofFile && notes && !referenceNumber) {
        toast.error("Reference number required when adding notes");
        return;
      }

      if (proofFile) {
        const formData = new FormData();
        formData.append("reservationId", reservationId);
        formData.append("image", proofFile, proofFile.name);
        if (referenceNumber) {
          formData.append("referenceNumber", referenceNumber);
        }
        if (notes) {
          formData.append("notes", notes);
        }

        await uploadPaymentProof.mutateAsync(formData);
      } else if (referenceNumber) {
        await addPaymentProof.mutateAsync({
          reservationId,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        });
      }

      await markPayment.mutateAsync({ reservationId, termsAccepted: true });

      try {
        await warmupAfterPayment(reservationId);
      } catch {
        // Best-effort warmup; navigation should continue.
      }

      reset({
        referenceNumber: values.referenceNumber ?? "",
        notes: values.notes ?? "",
        proofFile: null,
      });
      router.push(`/reservations/${reservationId}`);
    } catch (_error) {
      toast.error("Failed to submit payment");
    }
  };

  const handleGroupPaymentSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }
    if (!reservationGroupId) return;

    try {
      await markPaymentGroup.mutateAsync({
        reservationGroupId,
        termsAccepted: true,
      });
      router.push(appRoutes.reservations.detail(reservationId));
    } catch {
      // handled in mutation hook
    }
  };

  const handleOpenChat = () => {
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId,
          source: "reservation-payment",
        },
      }),
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  const isPaymentExpired =
    reservation?.status === "EXPIRED" || (reservation ? isExpired : false);
  const effectivePriceCents = reservation?.totalPriceCents ?? 0;
  const priceCurrency = reservation?.currency ?? "PHP";
  const isFreeSlot = effectivePriceCents === 0;
  const price = isFreeSlot
    ? "Free"
    : formatCurrency(effectivePriceCents ?? 0, priceCurrency);
  const slotDate = reservation?.startTime
    ? format(new Date(reservation.startTime), "EEEE, MMMM d, yyyy")
    : undefined;
  const slotTime = reservation?.startTime
    ? `${format(new Date(reservation.startTime), "h:mm a")} - ${format(
        new Date(reservation.endTime),
        "h:mm a",
      )}`
    : undefined;

  const isSubmitting =
    markPayment.isPending ||
    uploadPaymentProof.isPending ||
    addPaymentProof.isPending ||
    formSubmitting;

  const isSubmitDisabled = isSubmitting || !termsAccepted || isExpired;

  const expiresInMinutes = reservation?.expiresAt
    ? Math.max(
        1,
        differenceInMinutes(new Date(reservation.expiresAt), new Date()),
      )
    : 15;

  if (isPaymentExpired) {
    return (
      <Container className="py-6">
        <ReservationExpired
          courtId={reservation?.courtId ?? undefined}
          slotDate={slotDate}
          slotTime={slotTime}
          amount={price}
        />
      </Container>
    );
  }

  // Already completed
  if (reservation?.status !== "AWAITING_PAYMENT") {
    return (
      <Container className="py-6">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-[#059669] mb-4" />
              <h2 className="font-heading font-semibold text-lg mb-2">
                Payment Already Marked
              </h2>
              <p className="text-muted-foreground mb-4">
                {reservation?.status === "PAYMENT_MARKED_BY_USER"
                  ? "Your payment is awaiting owner confirmation."
                  : reservation?.status === "CONFIRMED"
                    ? "Your reservation is confirmed!"
                    : "This reservation has been processed."}
              </p>
              {isChatEnabledForReservationStatus ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mb-3 w-full"
                  onClick={handleOpenChat}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Owner
                </Button>
              ) : null}
              <Button asChild>
                <Link href={`/reservations/${reservationId}`}>
                  View Reservation
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // --- Group Payment Flow ---
  if (isGroupPayment && groupData) {
    const totalPayableCents = payableAwaitingItems.reduce(
      (sum, item) => sum + item.totalPriceCents,
      0,
    );
    const groupCurrency = payableAwaitingItems[0]?.currency ?? "PHP";

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
                  <Link href={appRoutes.reservations.detail(reservationId)}>
                    View Reservation
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      );
    }

    return (
      <Container className="py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(appRoutes.reservations.detail(reservationId))
              }
              className="-ml-2 mb-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reservation
            </Button>
            <h1 className="text-2xl font-heading font-bold">
              Complete Group Payment
            </h1>
            <p className="text-muted-foreground mt-1">
              Submit payment once for all payable items in this reservation
              group.
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
                  {formatCurrency(totalPayableCents, groupCurrency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <PaymentInfoCard
            paymentMethods={paymentInfo?.methods}
            expiresInMinutes={groupExpiresInMinutes}
          />

          {isChatEnabledForReservationStatus ? (
            <Button variant="outline" onClick={handleOpenChat}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Owner
            </Button>
          ) : null}

          <TermsCheckbox
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
          />

          <Button
            className="w-full"
            size="lg"
            disabled={!termsAccepted || markPaymentGroup.isPending}
            onClick={handleGroupPaymentSubmit}
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

  // --- Individual Payment Flow ---
  return (
    <Container className="py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-heading font-bold">
            Complete Your Payment
          </h1>
          <p className="text-muted-foreground mt-1">
            Pay the court owner and mark your payment below
          </p>
        </div>

        {reservation?.expiresAt && (
          <div className="mb-6">
            <CountdownTimer
              expiresAt={reservation.expiresAt}
              onExpire={() => setIsExpired(true)}
            />
          </div>
        )}

        {/* Reservation Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-heading font-semibold">
                  {reservation &&
                    format(new Date(reservation.startTime), "h:mm a")}{" "}
                  -
                  {reservation &&
                    format(new Date(reservation.endTime), "h:mm a")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reservation &&
                    format(
                      new Date(reservation.startTime),
                      "EEEE, MMMM d, yyyy",
                    )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Due</span>
              <span className="text-2xl font-heading font-bold text-primary">
                {price}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <PaymentInfoCard
            paymentMethods={paymentInfo?.methods}
            expiresInMinutes={expiresInMinutes}
          />
        </div>

        {isChatEnabledForReservationStatus ? (
          <Button
            type="button"
            variant="outline"
            className="mb-6 w-full"
            onClick={handleOpenChat}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Owner
          </Button>
        ) : null}

        <StandardFormProvider
          form={form}
          onSubmit={handleMarkPaid}
          className="space-y-6"
        >
          <PaymentProofForm />

          <TermsCheckbox
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
          />

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />I Have Paid
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By clicking "I Have Paid", you confirm that you have completed the
            payment to the court owner. The owner will verify your payment and
            confirm your reservation.
          </p>

          <div className="text-center">
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href={`/reservations/${reservationId}`}>
                Cancel and view reservation
              </Link>
            </Button>
          </div>
        </StandardFormProvider>
      </div>
    </Container>
  );
}
