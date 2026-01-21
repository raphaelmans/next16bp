"use client";

import { addMinutes } from "date-fns";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
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
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import {
  useCreateReservationForAnyCourt,
  useCreateReservationForCourt,
} from "@/features/reservation/hooks";
import { useProfile } from "@/features/reservation/hooks/use-profile";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { normalizeDurationMinutes } from "@/shared/lib/duration";
import { formatCurrency, formatDuration } from "@/shared/lib/format";
import { getZonedDate } from "@/shared/lib/time-zone";

const DEFAULT_DURATION_MINUTES = 60;
const selectionModeSchema = ["any", "court"] as const;

export default function PlaceBookingPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const placeId = (params.placeId ?? params.id) as string;

  const [bookingParams] = useQueryStates({
    startTime: parseAsString,
    duration: parseAsInteger,
    sportId: parseAsString,
    mode: parseAsStringLiteral(selectionModeSchema),
    courtId: parseAsString,
  });

  const startTime = bookingParams.startTime ?? undefined;
  const durationParam = bookingParams.duration ?? undefined;
  const sportId = bookingParams.sportId ?? undefined;
  const modeParam = bookingParams.mode ?? undefined;
  const mode = modeParam ?? "any";
  const courtId = bookingParams.courtId ?? undefined;

  const durationMinutes = normalizeDurationMinutes(
    durationParam ?? DEFAULT_DURATION_MINUTES,
    DEFAULT_DURATION_MINUTES,
  );

  const { data: place, isLoading } = usePlaceDetail({ placeId });
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";
  const verificationStatus = place?.verification?.status ?? "UNVERIFIED";
  const reservationsEnabled = place?.verification?.reservationsEnabled ?? false;
  const isVerified = verificationStatus === "VERIFIED";
  const showBooking =
    place?.placeType === "RESERVABLE" && isVerified && reservationsEnabled;
  const bookingDate = React.useMemo(
    () => (startTime ? getZonedDate(startTime, placeTimeZone) : undefined),
    [startTime, placeTimeZone],
  );

  const bookingRedirect = React.useMemo(() => {
    const params = new URLSearchParams();

    if (startTime) {
      params.set("startTime", startTime);
    }
    if (durationParam != null) {
      params.set("duration", String(durationParam));
    }
    if (sportId) {
      params.set("sportId", sportId);
    }
    if (modeParam) {
      params.set("mode", modeParam);
    }
    if (courtId) {
      params.set("courtId", courtId);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [courtId, durationParam, modeParam, pathname, sportId, startTime]);
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

  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const detailsSectionRef = React.useRef<HTMLDivElement | null>(null);
  const isSubmitting = createForCourt.isPending || createForAnyCourt.isPending;

  const isProfileComplete =
    !!profile?.displayName && (!!profile?.email || !!profile?.phoneNumber);

  const scrollToSection = React.useCallback(
    (ref: React.RefObject<HTMLElement | null>) => {
      const element = ref.current;
      if (!element || typeof window === "undefined") return;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [],
  );

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

  if (!place || !showBooking) {
    return (
      <Container className="py-12">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Bookings not available</h1>
          <p className="text-muted-foreground">
            This venue is not accepting reservations yet.
          </p>
          <Link
            href={appRoutes.places.detail(placeId)}
            className="text-primary hover:underline inline-block"
          >
            Back to place
          </Link>
        </div>
      </Container>
    );
  }

  if (!selectedSlot || !endTime) {
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
          <div ref={detailsSectionRef} className="scroll-mt-24">
            <BookingSummaryCard
              court={courtSummary}
              timeSlot={timeSlot}
              timeZone={placeTimeZone}
            />
          </div>

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
            redirectTo={bookingRedirect}
          />

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
                  Duration: {formatDuration(durationMinutes)} ·
                  {formatCurrency(totalPrice, currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <OrderSummary
            timeSlot={timeSlot}
            timeZone={placeTimeZone}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onConfirm={handleConfirm}
            onReviewDetails={() => scrollToSection(detailsSectionRef)}
            reviewLabel="Review booking details"
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
