"use client";

import { addMinutes } from "date-fns";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { normalizeDurationMinutes } from "@/common/duration";
import { formatCurrency, formatDuration } from "@/common/format";
import { getZonedDate } from "@/common/time-zone";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  useProfile,
} from "@/features/reservation/hooks";
import { trpc } from "@/trpc/client";

const DEFAULT_DURATION_MINUTES = 60;
const selectionModeSchema = ["any", "court"] as const;

export default function PlaceBookingPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const placeIdOrSlug = (params.placeId ?? params.id) as string;

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

  const { data: place, isLoading } = usePlaceDetail({
    placeIdOrSlug,
  });
  const resolvedPlaceId = place?.id;
  const placeSlugOrId = place?.slug ?? place?.id ?? placeIdOrSlug;
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

  React.useEffect(() => {
    if (!place?.slug) return;
    if (placeIdOrSlug === place.slug) return;
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
    const nextPath = query
      ? `${appRoutes.places.book(place.slug)}?${query}`
      : appRoutes.places.book(place.slug);
    router.replace(nextPath);
  }, [
    courtId,
    durationParam,
    modeParam,
    place?.slug,
    placeIdOrSlug,
    router,
    sportId,
    startTime,
  ]);
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const createForCourt = useCreateReservationForCourt();
  const createForAnyCourt = useCreateReservationForAnyCourt();
  const createOpenPlay = trpc.openPlay.createFromReservation.useMutation();

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
  const hasResolvableInputs =
    !!resolvedPlaceId &&
    !!startTime &&
    !!bookingDate &&
    durationMinutes > 0 &&
    (mode === "court" ? !!courtId : !!sportId);
  const isResolvingAvailability =
    hasResolvableInputs &&
    !selectedSlot &&
    (availabilityQuery.isLoading || availabilityQuery.isFetching);

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
  const [hostAsOpenPlay, setHostAsOpenPlay] = React.useState(false);
  const [openPlayMaxPlayers, setOpenPlayMaxPlayers] = React.useState(4);
  const [openPlayJoinPolicy, setOpenPlayJoinPolicy] = React.useState<
    "REQUEST" | "AUTO"
  >("REQUEST");
  const [openPlayVisibility, setOpenPlayVisibility] = React.useState<
    "PUBLIC" | "UNLISTED"
  >("PUBLIC");
  const [openPlayNote, setOpenPlayNote] = React.useState("");
  const [openPlayPaymentInstructions, setOpenPlayPaymentInstructions] =
    React.useState("");
  const [openPlayPaymentLinkUrl, setOpenPlayPaymentLinkUrl] =
    React.useState("");
  const detailsSectionRef = React.useRef<HTMLDivElement | null>(null);
  const isSubmitting = createForCourt.isPending || createForAnyCourt.isPending;

  const suggestedSplitPerPlayerCents =
    totalPrice > 0
      ? Math.ceil(totalPrice / Math.max(1, openPlayMaxPlayers))
      : 0;

  React.useEffect(() => {
    const openPlayQuery = searchParams.get("openPlay");
    if (openPlayQuery === "1" || openPlayQuery === "true") {
      setHostAsOpenPlay(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (totalPrice > 0 && openPlayJoinPolicy !== "REQUEST") {
      setOpenPlayJoinPolicy("REQUEST");
    }
  }, [openPlayJoinPolicy, totalPrice]);

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
    if (mode === "any" && !resolvedPlaceId) {
      toast.error("Venue details unavailable.");
      return;
    }

    try {
      const payload = {
        startTime: selectedSlot.startTime,
        durationMinutes,
      };
      let result: { status: string; id: string };
      if (mode === "court" && courtId) {
        result = await createForCourt.mutateAsync({
          courtId,
          ...payload,
        });
      } else {
        if (!resolvedPlaceId) {
          toast.error("Venue details unavailable.");
          return;
        }
        result = await createForAnyCourt.mutateAsync({
          placeId: resolvedPlaceId,
          sportId: sportId ?? "",
          ...payload,
        });
      }

      let _openPlayId: string | null = null;
      if (hostAsOpenPlay) {
        try {
          const created = await createOpenPlay.mutateAsync({
            reservationId: result.id,
            maxPlayers: Math.max(2, Math.min(32, openPlayMaxPlayers)),
            joinPolicy: openPlayJoinPolicy,
            visibility: openPlayVisibility,
            note:
              openPlayNote.trim().length > 0 ? openPlayNote.trim() : undefined,
            paymentInstructions:
              openPlayPaymentInstructions.trim().length > 0
                ? openPlayPaymentInstructions.trim()
                : undefined,
            paymentLinkUrl:
              openPlayPaymentLinkUrl.trim().length > 0
                ? openPlayPaymentLinkUrl.trim()
                : undefined,
          });
          _openPlayId = created.openPlayId;
        } catch (_error) {
          toast.error(
            "Reservation created. Open Play wasn't created - you can create it from Reservation Details.",
          );
        }
      }

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
            href={appRoutes.places.detail(placeSlugOrId)}
            className="text-primary hover:underline inline-block"
          >
            Back to venue
          </Link>
        </div>
      </Container>
    );
  }

  if (isResolvingAvailability) {
    return <PlaceBookingSkeleton />;
  }

  if (!selectedSlot || !endTime) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking details missing</h1>
          <p className="text-muted-foreground mt-2">
            Please return to the venue page and select a valid time slot.
          </p>
          <Link
            href={appRoutes.places.detail(placeSlugOrId)}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to venue
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

          <Card>
            <CardHeader>
              <CardTitle>Open Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Host as Open Play</div>
                  <div className="text-xs text-muted-foreground">
                    Create a joinable session for other players after your
                    reservation is confirmed.
                  </div>
                </div>
                <Switch
                  checked={hostAsOpenPlay}
                  onCheckedChange={setHostAsOpenPlay}
                />
              </div>

              {hostAsOpenPlay ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openPlayMaxPlayers">Max players</Label>
                    <Input
                      id="openPlayMaxPlayers"
                      type="number"
                      min={2}
                      max={32}
                      value={openPlayMaxPlayers}
                      onChange={(e) => {
                        const next = Number.parseInt(e.target.value, 10);
                        setOpenPlayMaxPlayers(Number.isFinite(next) ? next : 4);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Includes you as the host.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Join policy</Label>
                    <Select
                      value={openPlayJoinPolicy}
                      onValueChange={(value) =>
                        setOpenPlayJoinPolicy(value as "REQUEST" | "AUTO")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUEST">
                          Request (Host approves)
                        </SelectItem>
                        <SelectItem value="AUTO" disabled={totalPrice > 0}>
                          Auto-join (If spots)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {totalPrice > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Paid sessions require host approval.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Visibility</Label>
                    <Select
                      value={openPlayVisibility}
                      onValueChange={(value) =>
                        setOpenPlayVisibility(value as "PUBLIC" | "UNLISTED")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="UNLISTED">
                          Unlisted (Link only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayNote">Note (optional)</Label>
                    <Input
                      id="openPlayNote"
                      value={openPlayNote}
                      onChange={(e) => setOpenPlayNote(e.target.value)}
                      placeholder="e.g. Beginner-friendly, bring extra balls"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Reservation total</Label>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                      {formatCurrency(totalPrice, currency)}
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Suggested split</Label>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                      Est.{" "}
                      {formatCurrency(suggestedSplitPerPlayerCents, currency)}
                      /player (based on {openPlayMaxPlayers} players)
                    </div>
                    {totalPrice > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        For paid sessions, use Request so you can confirm
                        players after payment.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayPaymentInstructions">
                      Payment instructions (optional)
                    </Label>
                    <Input
                      id="openPlayPaymentInstructions"
                      value={openPlayPaymentInstructions}
                      onChange={(e) =>
                        setOpenPlayPaymentInstructions(e.target.value)
                      }
                      placeholder="e.g. GCash 09xx..., send screenshot in chat"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="openPlayPaymentLinkUrl">
                      Payment link (optional)
                    </Label>
                    <Input
                      id="openPlayPaymentLinkUrl"
                      type="url"
                      value={openPlayPaymentLinkUrl}
                      onChange={(e) =>
                        setOpenPlayPaymentLinkUrl(e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : null}
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
