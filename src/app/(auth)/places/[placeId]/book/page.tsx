"use client";

import { addMinutes } from "date-fns";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  usePlaceAvailability,
  usePlaceDetail,
} from "@/features/discovery/hooks";
import { BookingSummaryCard } from "@/features/reservation/components/booking-summary-card";
import { OrderSummary } from "@/features/reservation/components/order-summary";
import { PaymentInfoCard } from "@/features/reservation/components/payment-info-card";
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import {
  useCreateReservationForAnyCourt,
  useCreateReservationForCourt,
} from "@/features/reservation/hooks";
import { useProfile } from "@/features/reservation/hooks/use-profile";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { formatDuration } from "@/shared/lib/format";

const PAYMENT_METHODS = [
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

const DURATIONS = [60, 120, 180];

export default function PlaceBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const placeId = (params.placeId ?? params.id) as string;
  const startTime = searchParams.get("startTime");
  const durationParam = Number(searchParams.get("duration") ?? "60");
  const sportId = searchParams.get("sportId") ?? undefined;
  const mode = (searchParams.get("mode") as "any" | "court" | null) ?? "any";
  const courtId = searchParams.get("courtId") ?? undefined;

  const durationMinutes = DURATIONS.includes(durationParam)
    ? durationParam
    : DURATIONS[0];

  const bookingDate = startTime ? new Date(startTime) : undefined;

  const { data: place, isLoading } = usePlaceDetail({ placeId });
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const createForCourt = useCreateReservationForCourt();
  const createForAnyCourt = useCreateReservationForAnyCourt();

  const availabilityQuery = usePlaceAvailability({
    place: place ?? undefined,
    sportId,
    courtId,
    date: bookingDate,
    durationMinutes,
    mode,
  });

  const availability = availabilityQuery.data ?? [];
  const selectedSlot = availability.find(
    (slot) => slot.startTime === startTime,
  );

  const assignedCourt = React.useMemo(() => {
    if (!place) return undefined;
    const targetCourtId =
      mode === "court" ? courtId : (selectedSlot?.courtId ?? undefined);
    return place.courts.find((court) => court.id === targetCourtId);
  }, [courtId, mode, place, selectedSlot?.courtId]);

  const assignedCourtLabel =
    assignedCourt?.label ?? selectedSlot?.courtLabel ?? "Assigned at checkout";

  const endTime = startTime
    ? addMinutes(new Date(startTime), durationMinutes).toISOString()
    : undefined;

  const totalPrice = selectedSlot?.totalPriceCents ?? 0;
  const currency = selectedSlot?.currency ?? "PHP";
  const isFree = totalPrice === 0;

  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const isSubmitting = createForCourt.isPending || createForAnyCourt.isPending;

  const isProfileComplete =
    !!profile?.displayName && (!!profile?.email || !!profile?.phoneNumber);

  const handleConfirm = async () => {
    if (!selectedSlot || isSubmitting) return;
    if (mode === "court" && !courtId) {
      toast.error("Select a court to continue.");
      return;
    }
    if (mode === "any" && !sportId) {
      toast.error("Select a sport to continue.");
      return;
    }

    try {
      const payload = {
        startTime: selectedSlot.startTime,
        durationMinutes,
      };
      const result =
        mode === "court" && courtId
          ? await createForCourt.mutateAsync({
              courtId,
              ...payload,
            })
          : await createForAnyCourt.mutateAsync({
              placeId,
              sportId: sportId ?? "",
              ...payload,
            });

      const requiresPayment = result.status === "AWAITING_PAYMENT";
      router.push(
        requiresPayment
          ? appRoutes.reservations.payment(result.id)
          : appRoutes.reservations.detail(result.id),
      );
    } catch (_error) {
      // toast handled by mutation hooks
    }
  };

  if (isLoading || isLoadingProfile) {
    return <PlaceBookingSkeleton />;
  }

  if (!place || !selectedSlot || !endTime) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking details missing</h1>
          <p className="text-muted-foreground mt-2">
            Please return to the place page and select a valid time slot.
          </p>
          <Link
            href={appRoutes.places.detail(placeId)}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to place
          </Link>
        </div>
      </Container>
    );
  }

  const courtSummaryName = assignedCourt?.label ?? selectedSlot?.courtLabel;
  const courtSummary = {
    name: courtSummaryName ? `${place.name} · ${courtSummaryName}` : place.name,
    address: place.address,
    coverImageUrl: place.coverImageUrl,
  };

  const timeSlot = {
    startTime: selectedSlot.startTime,
    endTime,
    priceCents: totalPrice,
    currency,
  };

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Progress value={100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Step 2 of 2 · Review and confirm
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <BookingSummaryCard court={courtSummary} timeSlot={timeSlot} />

          <Card>
            <CardHeader>
              <CardTitle>Assigned court</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm">
              {assignedCourt?.sportName && (
                <Badge variant="outline">{assignedCourt.sportName}</Badge>
              )}
              <span className="font-medium">{assignedCourtLabel}</span>
              {assignedCourt?.tierLabel && (
                <Badge variant="secondary" className="ml-2">
                  {assignedCourt.tierLabel}
                </Badge>
              )}
            </CardContent>
          </Card>

          <ProfilePreviewCard
            profile={{
              displayName: profile?.displayName ?? undefined,
              email: profile?.email ?? undefined,
              phone: profile?.phoneNumber ?? undefined,
              avatarUrl: profile?.avatarUrl ?? undefined,
            }}
            isComplete={isProfileComplete}
          />

          {!isFree && (
            <PaymentInfoCard
              paymentMethods={PAYMENT_METHODS}
              expiresInMinutes={15}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reservation contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>
                  After you confirm, your request is held while the owner
                  reviews availability.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-accent" />
                <span>
                  Duration: {formatDuration(durationMinutes)} · {currency}{" "}
                  {totalPrice.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <OrderSummary
            timeSlot={timeSlot}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
            disabled={!isProfileComplete}
            className="sticky top-24"
          />
        </div>
      </div>
    </Container>
  );
}

function PlaceBookingSkeleton() {
  return (
    <Container className="py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
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
