"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/shared/components/layout";
import { BookingSummaryCard } from "@/features/reservation/components/booking-summary-card";
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import { OrderSummary } from "@/features/reservation/components/order-summary";
import { useProfile } from "@/features/reservation/hooks/use-profile";
import { useCreateReservation } from "@/features/reservation/hooks/use-create-reservation";

export default function BookSlotPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;
  const slotId = params.slotId as string;

  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const createReservation = useCreateReservation();

  // TODO: Fetch court and slot data from API
  const court = {
    name: "Sample Court",
    address: "123 Main St, Manila",
    coverImageUrl: undefined,
  };

  const timeSlot = {
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    priceCents: 50000,
    currency: "PHP",
  };

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
    !!profile?.displayName && !!profile?.email && !!profile?.phoneNumber;

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
        router.push(`/reservations/${result.id}/payment`);
      } else {
        router.push(`/reservations/${result.id}`);
      }
    } catch (error) {
      // Show error toast
      toast.error("Failed to create reservation", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (isLoadingProfile) {
    return <BookSlotPageSkeleton />;
  }

  return (
    <Container className="py-6">
      <PageHeader
        title="Complete Your Booking"
        breadcrumbs={[
          { label: "Courts", href: "/courts" },
          { label: court.name, href: `/courts/${courtId}` },
          { label: "Book" },
        ]}
        backHref={`/courts/${courtId}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <BookingSummaryCard court={court} timeSlot={timeSlot} />

          {/* Profile Preview */}
          <ProfilePreviewCard
            profile={profile || {}}
            isComplete={isProfileComplete}
          />

          {/* Payment Info (for paid courts) */}
          {timeSlot.priceCents > 0 && (
            <PaymentInfoCard paymentMethods={paymentMethods} />
          )}
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
