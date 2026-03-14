"use client";

import { addDays } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShortInTimeZone,
  formatDuration,
  formatTimeInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { getZonedStartOfDayIso, getZonedToday } from "@/common/time-zone";
import { Container } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePreviewCard } from "@/features/reservation/components/profile-preview-card";
import { ProfileSetupModal } from "@/features/reservation/components/profile-setup-modal";
import { useQueryProfile } from "@/features/reservation/hooks";
import { isProfileComplete } from "@/lib/modules/profile/shared/domain";
import {
  useModCoachAddonsForBooking,
  useModCoachAvailability,
  useModCoachDetail,
} from "../hooks/availability";
import { useMutCreateReservationForCoach } from "../hooks/booking";

const DEFAULT_DURATION_MINUTES = 60;

type CoachBookingPageProps = {
  coachIdOrSlug: string;
};

export default function CoachBookingPage({
  coachIdOrSlug,
}: CoachBookingPageProps) {
  const router = useRouter();

  const { data: coach, isLoading: isLoadingCoach } = useModCoachDetail({
    coachIdOrSlug,
  });

  const coachId = coach?.coach?.id ?? null;
  const coachTimeZone = coach?.coach?.timeZone ?? "Asia/Manila";
  const coachSlug = coach?.coach?.slug ?? coachIdOrSlug;

  const sessionDurations = React.useMemo(
    () =>
      (coach?.sessionDurations ?? [])
        .map((d) => d.duration)
        .sort((a, b) => a - b),
    [coach?.sessionDurations],
  );
  const defaultDuration =
    sessionDurations.length > 0
      ? sessionDurations.includes(DEFAULT_DURATION_MINUTES)
        ? DEFAULT_DURATION_MINUTES
        : sessionDurations[0]
      : DEFAULT_DURATION_MINUTES;

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined,
  );
  const [durationMinutes, setDurationMinutes] =
    React.useState<number>(defaultDuration);
  const [selectedSlotTime, setSelectedSlotTime] = React.useState<string | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  React.useEffect(() => {
    if (sessionDurations.length > 0) {
      setDurationMinutes((prev) =>
        sessionDurations.includes(prev) ? prev : sessionDurations[0],
      );
    }
  }, [sessionDurations]);

  const today = React.useMemo(
    () => getZonedToday(coachTimeZone),
    [coachTimeZone],
  );
  const maxDate = React.useMemo(() => addDays(today, 90), [today]);

  const dateIso = React.useMemo(
    () =>
      selectedDate
        ? getZonedStartOfDayIso(selectedDate, coachTimeZone)
        : undefined,
    [selectedDate, coachTimeZone],
  );

  const {
    data: availability,
    isLoading: isLoadingAvailability,
    isFetching: isFetchingAvailability,
  } = useModCoachAvailability({
    coachId: coachId ?? "",
    date: dateIso ?? "",
    durationMinutes,
    enabled: !!coachId && !!dateIso,
  });

  useModCoachAddonsForBooking({
    coachId,
    enabled: !!coachId,
  });

  const availableSlots = React.useMemo(
    () =>
      (availability?.options ?? []).filter((opt) => opt.status === "AVAILABLE"),
    [availability],
  );

  const selectedSlot = React.useMemo(
    () =>
      selectedSlotTime
        ? (availableSlots.find((s) => s.startTime === selectedSlotTime) ?? null)
        : null,
    [availableSlots, selectedSlotTime],
  );

  const slotResetKey = `${selectedDate?.toISOString()}-${durationMinutes}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset slot when date or duration changes
  React.useEffect(() => {
    setSelectedSlotTime(null);
  }, [slotResetKey]);

  const { data: profile } = useQueryProfile();
  const profileComplete = isProfileComplete(profile ?? null);

  const createBooking = useMutCreateReservationForCoach();

  const handleConfirmBooking = React.useCallback(() => {
    if (!coachId || !selectedSlot || !termsAccepted) return;

    if (!profileComplete) {
      setShowProfileModal(true);
      return;
    }

    createBooking.mutate(
      {
        coachId,
        startTime: selectedSlot.startTime,
        durationMinutes,
      },
      {
        onSuccess: (data) => {
          router.push(appRoutes.reservations.detail(data.id));
        },
      },
    );
  }, [
    coachId,
    selectedSlot,
    termsAccepted,
    profileComplete,
    durationMinutes,
    createBooking,
    router,
  ]);

  if (isLoadingCoach) {
    return (
      <Container className="py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!coach) {
    return (
      <Container className="py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Coach not found</h2>
          <p className="text-muted-foreground mt-2">
            The coach you are looking for does not exist or has been
            deactivated.
          </p>
          <Button asChild className="mt-4">
            <Link href={appRoutes.coaches.base}>Browse coaches</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const coachName = coach.coach.name;
  const avatarUrl = coach.media?.avatarUrl ?? null;
  const sportNames = coach.meta?.sports?.map((s) => s.name).join(", ") ?? "";
  const baseRateCents = coach.coach.baseHourlyRateCents;
  const currency = coach.coach.baseHourlyRateCurrency ?? "PHP";
  const initials = coachName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const diagnostics = availability?.diagnostics;
  const noSchedule = diagnostics && !diagnostics.hasHoursWindows;
  const noPricing = diagnostics && !diagnostics.hasRateRules;
  const noHoursForDay = diagnostics && !diagnostics.dayHasHours;

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={appRoutes.coaches.detail(coachSlug)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to profile
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        Book a session with {coachName}
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coach summary card */}
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar className="h-14 w-14">
                <AvatarImage src={avatarUrl ?? undefined} alt={coachName} />
                <AvatarFallback>
                  {initials || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{coachName}</h3>
                {sportNames && (
                  <p className="text-sm text-muted-foreground">{sportNames}</p>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(baseRateCents, currency)}
                </div>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </CardContent>
          </Card>

          {/* Duration selection */}
          {sessionDurations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={String(durationMinutes)}
                  onValueChange={(v) => setDurationMinutes(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionDurations.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {formatDuration(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Date picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < today || date > maxDate}
                className="rounded-md border mx-auto"
              />
            </CardContent>
          </Card>

          {/* Time slots */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Available Times
                  {isFetchingAvailability && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAvailability ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : noSchedule ? (
                  <p className="text-sm text-muted-foreground">
                    This coach has not set up their schedule yet.
                  </p>
                ) : noPricing ? (
                  <p className="text-sm text-muted-foreground">
                    This coach has not set up their pricing yet.
                  </p>
                ) : noHoursForDay ? (
                  <p className="text-sm text-muted-foreground">
                    The coach is not available on this day. Try another date.
                  </p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No available time slots for this date and duration. Try
                    another date or a shorter session.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlotTime === slot.startTime;
                      return (
                        <Button
                          key={slot.startTime}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setSelectedSlotTime(
                              isSelected ? null : slot.startTime,
                            )
                          }
                        >
                          {formatTimeInTimeZone(slot.startTime, coachTimeZone)}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Player profile */}
          {selectedSlot && profile && (
            <ProfilePreviewCard
              profile={{
                displayName: profile.displayName,
                email: profile.email,
                phone: profile.phoneNumber,
                avatarUrl: profile.avatarUrl,
              }}
              isComplete={profileComplete}
              redirectTo={appRoutes.coaches.book(coachSlug)}
              onEditClick={() => setShowProfileModal(true)}
            />
          )}
        </div>

        {/* Right column: Order summary */}
        <div className="space-y-6">
          {selectedSlot ? (
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coach info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl ?? undefined} alt={coachName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{coachName}</p>
                    {sportNames && (
                      <p className="text-xs text-muted-foreground">
                        {sportNames}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date and time */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span>
                      {formatDateShortInTimeZone(
                        selectedSlot.startTime,
                        coachTimeZone,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span>
                      {formatTimeRangeInTimeZone(
                        selectedSlot.startTime,
                        selectedSlot.endTime,
                        coachTimeZone,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{formatDuration(durationMinutes)}</span>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Session fee</span>
                    <span>
                      {formatCurrency(
                        selectedSlot.totalPriceCents,
                        selectedSlot.currency ?? currency,
                      )}
                    </span>
                  </div>
                </div>

                {/* Pricing warnings */}
                {selectedSlot.pricingWarnings &&
                  selectedSlot.pricingWarnings.length > 0 && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {selectedSlot.pricingWarnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Total */}
                <div className="flex justify-between font-medium text-lg pt-4 border-t">
                  <span>Total</span>
                  <span>
                    {formatCurrency(
                      selectedSlot.totalPriceCents,
                      selectedSlot.currency ?? currency,
                    )}
                  </span>
                </div>

                {/* Coach review notice */}
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-800">
                    After booking, the coach will review your request. You will
                    be notified once they accept.
                  </p>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-2 pt-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked === true)
                    }
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-snug cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href={appRoutes.terms.base}
                      className="text-primary hover:underline"
                    >
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href={appRoutes.privacy.base}
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                {/* Confirm button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleConfirmBooking}
                  disabled={
                    !termsAccepted ||
                    createBooking.isPending ||
                    !profileComplete
                  }
                >
                  {createBooking.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select a date and time to see your booking summary.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Profile setup modal */}
      <ProfileSetupModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </Container>
  );
}
