"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { BookingSummaryCard } from "@/features/reservation/components/booking-summary-card";
import { OrderSummary } from "@/features/reservation/components/order-summary";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import { useCreateReservation } from "@/features/reservation/hooks/use-create-reservation";
import { useProfile } from "@/features/reservation/hooks/use-profile";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { formatDuration } from "@/shared/lib/format";
import { useTRPC } from "@/trpc/client";

interface ReservableDetail {
  requiresOwnerConfirmation?: boolean | null;
  paymentHoldMinutes?: number | null;
  ownerReviewMinutes?: number | null;
  cancellationCutoffMinutes?: number | null;
}

export default function BookSlotPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;
  const slotId = params.slotId as string;

  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const createReservation = useCreateReservation();

  // Fetch court data from API
  const trpc = useTRPC();
  const { data: courtData, isLoading: isLoadingCourt } = useQuery(
    trpc.court.getById.queryOptions({ id: courtId }),
  );

  // Fetch slot data from API
  const { data: slotData, isLoading: isLoadingSlot } = useQuery(
    trpc.timeSlot.getById.queryOptions({ slotId }),
  );

  const court = courtData
    ? {
        name: courtData.court.name,
        address: courtData.court.address,
        coverImageUrl: courtData.photos[0]?.url,
      }
    : undefined;

  const reservableDetail =
    courtData?.court.courtType === "RESERVABLE"
      ? (courtData.detail as ReservableDetail | null)
      : null;

  const effectivePriceCents = slotData
    ? (slotData.priceCents ?? slotData.defaultPriceCents ?? 0)
    : 0;
  const effectiveCurrency = slotData
    ? (slotData.currency ?? slotData.defaultCurrency ?? "PHP")
    : "PHP";
  const isFreeSlot = slotData?.isFree || effectivePriceCents === 0;
  const paymentHoldMinutes = reservableDetail?.paymentHoldMinutes ?? 15;
  const requiresOwnerConfirmation =
    reservableDetail?.requiresOwnerConfirmation ?? true;
  const cancellationCutoffMinutes =
    reservableDetail?.cancellationCutoffMinutes ?? 0;
  const paymentHoldLabel = formatDuration(paymentHoldMinutes);
  const cancellationCutoffLabel =
    cancellationCutoffMinutes > 0
      ? `${formatDuration(cancellationCutoffMinutes)} before start`
      : "No cutoff (until start)";

  const timeSlot = slotData
    ? {
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        priceCents: effectivePriceCents,
        currency: effectiveCurrency,
      }
    : undefined;

  const paymentMethods = [
    {
      type: "gcash" as const,
      accountName: "KudosCourts",
      accountNumber: "09123456789",
    },
    {
      type: "bank" as const,
      accountName: "KudosCourts Inc.",
      accountNumber: "1234567890",
      bankName: "BDO",
    },
  ];

  const isProfileComplete =
    !!profile?.displayName && (!!profile?.email || !!profile?.phoneNumber);

  const handleConfirm = async () => {
    try {
      const result = await createReservation.mutateAsync({
        timeSlotId: slotId,
      });

      // Show success toast
      toast.success("Reservation created!", {
        description: "Check your email for confirmation details.",
      });

      // Redirect based on whether payment is required
      const requiresPayment = result.status === "AWAITING_PAYMENT";
      if (requiresPayment) {
        router.push(appRoutes.reservations.payment(result.id));
      } else {
        router.push(appRoutes.reservations.detail(result.id));
      }
    } catch (error) {
      // Show error toast
      toast.error("Failed to create reservation", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (isLoadingProfile || isLoadingCourt || isLoadingSlot) {
    return <BookSlotPageSkeleton />;
  }

  if (!court || !timeSlot) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Court or time slot not found</h1>
          <p className="text-muted-foreground mt-2">
            The court or time slot you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href={appRoutes.courts.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Browse all courts
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <PageHeader
        title="Complete Your Booking"
        breadcrumbs={[
          { label: "Courts", href: appRoutes.courts.base },
          { label: court.name, href: appRoutes.courts.detail(courtId) },
          { label: "Book" },
        ]}
        backHref={appRoutes.courts.detail(courtId)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <BookingSummaryCard court={court} timeSlot={timeSlot} />

          {/* Profile Preview */}
          <ProfilePreviewCard
            profile={{
              displayName: profile?.displayName ?? undefined,
              email: profile?.email ?? undefined,
              phone: profile?.phoneNumber ?? undefined,
              avatarUrl: profile?.avatarUrl ?? undefined,
            }}
            isComplete={isProfileComplete}
          />

          {/* Payment Info (for paid courts) */}
          {!isFreeSlot && (
            <PaymentInfoCard
              paymentMethods={paymentMethods}
              expiresInMinutes={paymentHoldMinutes}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reservation Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment window</span>
                <span>{paymentHoldLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Owner confirmation
                </span>
                <span>
                  {isFreeSlot
                    ? "Not required (free booking)"
                    : requiresOwnerConfirmation
                      ? "Required"
                      : "Auto-confirmed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Cancellation cutoff
                </span>
                <span>{cancellationCutoffLabel}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary (sticky) */}
        <div>
          <OrderSummary
            timeSlot={timeSlot}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onConfirm={handleConfirm}
            isSubmitting={createReservation.isPending}
            disabled={!isProfileComplete}
            className="sticky top-24"
          />
        </div>
      </div>
    </Container>
  );
}

function BookSlotPageSkeleton() {
  return (
    <Container className="py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
        <div>
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
