"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, format } from "date-fns";
import { ArrowLeft, CheckCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useMarkPayment,
  useUploadPaymentProof,
} from "@/features/reservation/hooks";
import { Container } from "@/shared/components/layout";
import { formatCurrency } from "@/shared/lib/format";
import { trpc } from "@/trpc/client";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;
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
    trpc.reservation.getDetail.useQuery({ reservationId });

  const reservation = reservationDetail?.reservation;
  const slot = reservationDetail?.timeSlot;

  const { data: paymentInfo } = trpc.reservation.getPaymentInfo.useQuery(
    { reservationId },
    {
      enabled:
        reservation?.status === "AWAITING_PAYMENT" ||
        reservation?.status === "PAYMENT_MARKED_BY_USER",
    },
  );

  const addPaymentProof = trpc.paymentProof.add.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment proof");
    },
  });

  const uploadPaymentProof = useUploadPaymentProof();
  const markPayment = useMarkPayment();

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
  const effectivePriceCents = slot?.priceCents ?? 0;
  const priceCurrency = slot?.currency ?? "PHP";
  const isFreeSlot =
    slot?.isFree ||
    effectivePriceCents === null ||
    effectivePriceCents === undefined ||
    effectivePriceCents === 0;
  const price = isFreeSlot
    ? "Free"
    : formatCurrency(effectivePriceCents ?? 0, priceCurrency);
  const slotDate = slot?.startTime
    ? format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")
    : undefined;
  const slotTime = slot?.startTime
    ? `${format(new Date(slot.startTime), "h:mm a")} - ${format(
        new Date(slot.endTime),
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
          courtId={slot?.courtId ?? undefined}
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
                  {slot && format(new Date(slot.startTime), "h:mm a")} -
                  {slot && format(new Date(slot.endTime), "h:mm a")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {slot &&
                    format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
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
