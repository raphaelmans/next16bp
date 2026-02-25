"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AvailabilityEnablementAlertsProps = {
  showVerificationBanner: boolean;
  showReservationsDisabledBanner: boolean;
  showPaymentMethodBanner: boolean;
  showScheduleBanner: boolean;
  showPricingBanner: boolean;
  verificationStatus: string;
  verificationHref: string;
  scheduleHref: string;
  paymentMethodsHref: string;
};

export function AvailabilityEnablementAlerts({
  showVerificationBanner,
  showReservationsDisabledBanner,
  showPaymentMethodBanner,
  showScheduleBanner,
  showPricingBanner,
  verificationStatus,
  verificationHref,
  scheduleHref,
  paymentMethodsHref,
}: AvailabilityEnablementAlertsProps) {
  if (
    !showVerificationBanner &&
    !showReservationsDisabledBanner &&
    !showPaymentMethodBanner &&
    !showScheduleBanner &&
    !showPricingBanner
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showVerificationBanner ? (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>Venue not yet verified</AlertTitle>
          <AlertDescription>
            <p>
              Verification status: {verificationStatus.toLowerCase()}. Public
              bookings won&apos;t be available until this venue is verified.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href={verificationHref}>Go to verification</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showReservationsDisabledBanner ? (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>Reservations are disabled</AlertTitle>
          <AlertDescription>
            <p>Players cannot book online until reservations are enabled.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href={verificationHref}>Enable reservations</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showPaymentMethodBanner ? (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>No payment method configured</AlertTitle>
          <AlertDescription>
            <p>
              Add at least one payment method so reservations can be opened for
              public booking.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href={paymentMethodsHref}>Manage payment methods</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showScheduleBanner ? (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>No schedule hours configured</AlertTitle>
          <AlertDescription>
            <p>
              You haven&apos;t set up operating hours for this court yet. Add
              schedule hours to enable availability.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href={scheduleHref}>Edit schedule & pricing</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showPricingBanner ? (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>No pricing rules configured</AlertTitle>
          <AlertDescription>
            <p>
              You haven&apos;t set up pricing rules for this court yet. Add
              pricing to enable bookings.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href={scheduleHref}>Edit schedule & pricing</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
