"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useMarkPayment } from "@/features/reservation/hooks";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/shared/components/layout";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;
  const trpc = useTRPC();

  // Fetch reservation details
  const { data: reservation, isLoading } = useQuery({
    ...trpc.reservation.getById.queryOptions({ reservationId }),
  });

  // Fetch slot details for display
  const { data: slot } = useQuery({
    ...trpc.timeSlot.getById.queryOptions({
      slotId: reservation?.timeSlotId || "",
    }),
    enabled: !!reservation?.timeSlotId,
  });

  const markPayment = useMarkPayment();

  const handleMarkPaid = () => {
    markPayment.mutate(
      { reservationId, termsAccepted: true },
      {
        onSuccess: () => {
          router.push(`/reservations/${reservationId}`);
        },
      },
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

  const price = slot?.priceCents
    ? `₱${(slot.priceCents / 100).toFixed(0)}`
    : "—";

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

        {/* Payment Instructions (Simplified) */}
        <Card className="mb-6 bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold mb-3">How to Pay</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                Contact the court owner for payment details
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                Pay via GCash, bank transfer, or cash
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                Click "I Have Paid" below
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">4.</span>
                Wait for the owner to confirm your payment
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Mark Paid Button */}
        <Button
          onClick={handleMarkPaid}
          disabled={markPayment.isPending}
          className="w-full"
          size="lg"
        >
          {markPayment.isPending ? (
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

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          By clicking "I Have Paid", you confirm that you have completed the
          payment to the court owner. The owner will verify your payment and
          confirm your reservation.
        </p>

        {/* Cancel Option */}
        <div className="text-center mt-6">
          <Button variant="link" asChild className="text-muted-foreground">
            <Link href={`/reservations/${reservationId}`}>
              Cancel and view reservation
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
