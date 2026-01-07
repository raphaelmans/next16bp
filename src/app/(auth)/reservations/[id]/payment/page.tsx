"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/shared/components/layout";
import { CountdownBanner, FileUpload } from "@/shared/components/kudos";
import { BookingSummaryCard } from "@/features/reservation/components/booking-summary-card";
import { PaymentMethodCard } from "@/features/reservation/components/payment-method-card";
import { PaymentDisclaimer } from "@/features/reservation/components/payment-disclaimer";
import { useReservation } from "@/features/reservation/hooks/use-reservation";
import { useMarkPayment } from "@/features/reservation/hooks/use-mark-payment";
import { PaymentExpired } from "@/features/reservation/components/error-states";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | undefined>();
  const [notes, setNotes] = useState("");
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: reservation, isLoading } = useReservation(reservationId);
  const markPayment = useMarkPayment();

  // Mock payment methods
  const paymentMethods = [
    {
      type: "gcash" as const,
      accountName: "Court Owner Name",
      accountNumber: "09123456789",
    },
    {
      type: "bank" as const,
      accountName: "Court Owner Name",
      accountNumber: "1234567890",
      bankName: "BDO",
    },
  ];

  const handleExpire = () => {
    // Redirect to reservation detail on expiry
    router.push(`/reservations/${reservationId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted || !disclaimerAcknowledged) {
      return;
    }

    try {
      // Note: referenceNumber and notes are captured in the UI but the backend
      // currently only requires termsAccepted. These could be sent to paymentProof
      // endpoint separately if needed.
      await markPayment.mutateAsync({
        reservationId,
        termsAccepted: true as const,
      });

      router.push(`/reservations/${reservationId}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return <PaymentPageSkeleton />;
  }

  if (!reservation) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reservation not found</h1>
          <Link
            href="/reservations"
            className="text-primary hover:underline mt-4 inline-block"
          >
            View all reservations
          </Link>
        </div>
      </Container>
    );
  }

  // Check if payment window expired
  if (reservation.status === "EXPIRED") {
    return <PaymentExpired />;
  }

  const expiresAt = reservation.expiresAt
    ? new Date(reservation.expiresAt)
    : new Date(Date.now() + 15 * 60 * 1000); // Default 15 min

  const canSubmit =
    referenceNumber.trim() !== "" && disclaimerAcknowledged && termsAccepted;

  return (
    <>
      {/* Countdown Banner */}
      <CountdownBanner expiresAt={expiresAt} onExpire={handleExpire} />

      <Container className="py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/reservations">My Reservations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/reservations/${reservationId}`}>
                  Reservation Details
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Payment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Complete Your Payment
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Disclaimer */}
            <PaymentDisclaimer />

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <PaymentMethodCard
                    key={`${method.type}-${index}`}
                    type={method.type}
                    accountName={method.accountName}
                    accountNumber={method.accountNumber}
                    bankName={method.bankName}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Payment Proof Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Reference Number */}
                  <div className="space-y-2">
                    <Label htmlFor="referenceNumber">
                      Reference Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter your payment reference number"
                      required
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label>Receipt Screenshot (Optional)</Label>
                    <FileUpload value={receiptFile} onChange={setReceiptFile} />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="disclaimer"
                        checked={disclaimerAcknowledged}
                        onCheckedChange={(c) =>
                          setDisclaimerAcknowledged(c === true)
                        }
                      />
                      <Label
                        htmlFor="disclaimer"
                        className="text-sm leading-snug cursor-pointer"
                      >
                        I acknowledge that KudosCourts does not process payments
                        and is not responsible for any payment disputes.{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(c) => setTermsAccepted(c === true)}
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm leading-snug cursor-pointer"
                      >
                        I have completed the payment and agree to the{" "}
                        <a
                          href="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms and Conditions
                        </a>
                        . <span className="text-destructive">*</span>
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!canSubmit || markPayment.isPending}
                  >
                    {markPayment.isPending
                      ? "Submitting..."
                      : "Submit Payment Proof"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Summary */}
          <div>
            <BookingSummaryCard
              court={reservation.court}
              timeSlot={reservation.timeSlot}
              className="sticky top-24"
            />
          </div>
        </div>
      </Container>
    </>
  );
}

function PaymentPageSkeleton() {
  return (
    <Container className="py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
        <div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
