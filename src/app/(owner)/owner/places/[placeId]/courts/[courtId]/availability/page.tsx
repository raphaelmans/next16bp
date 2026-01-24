"use client";

import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { Loader2, Minus, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import { useOwnerOrganization } from "@/features/owner/hooks";
import {
  AvailabilityMonthView,
  type TimeSlot,
} from "@/shared/components/kudos";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/shared/lib/booking-window";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedDayRangeFromDayKey,
  getZonedToday,
  toUtcISOString,
} from "@/shared/lib/time-zone";
import { trpc } from "@/trpc/client";

const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 24;
const DEFAULT_DURATION_MINUTES = 60;
const clampDurationHours = (value: number) =>
  Math.min(Math.max(Math.round(value), MIN_DURATION_HOURS), MAX_DURATION_HOURS);

type MonthDayAvailability = {
  dayKey: string;
  date: Date;
  slots: TimeSlot[];
};

function parseDayKeyToDate(dayKey: string, timeZone?: string) {
  const range = getZonedDayRangeFromDayKey(dayKey, timeZone);
  return range.start;
}

function buildAvailabilityId(
  courtId: string,
  startTime: string,
  duration: number,
) {
  return `${courtId}-${startTime}-${duration}`;
}

export default function OwnerCourtAvailabilityPage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const courtId = params.courtId as string;
  const router = useRouter();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: placeData, isLoading: placeLoading } =
    trpc.placeManagement.getById.useQuery({ placeId }, { enabled: !!placeId });

  const { data: courtData, isLoading: courtLoading } =
    trpc.courtManagement.getById.useQuery({ courtId }, { enabled: !!courtId });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.availability(placeId, courtId),
    );
  };

  const placeTimeZone = placeData?.place.timeZone ?? "Asia/Manila";
  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const todayRange = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const maxDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const minMonthStart = React.useMemo(() => startOfMonth(today), [today]);
  const maxMonthStart = React.useMemo(() => startOfMonth(maxDate), [maxDate]);

  const [selectedDate, setSelectedDate] = React.useState<Date>(today);
  const [isDateInitialized, setIsDateInitialized] = React.useState(false);
  React.useEffect(() => {
    if (isDateInitialized) return;
    setSelectedDate(today);
    setIsDateInitialized(true);
  }, [isDateInitialized, today]);

  const [monthStart, setMonthStart] = React.useState<Date>(startOfMonth(today));
  const [isMonthInitialized, setIsMonthInitialized] = React.useState(false);
  React.useEffect(() => {
    if (isMonthInitialized) return;
    setMonthStart(startOfMonth(today));
    setIsMonthInitialized(true);
  }, [isMonthInitialized, today]);

  const monthEnd = React.useMemo(() => endOfMonth(monthStart), [monthStart]);
  const monthRangeStart = React.useMemo(() => {
    const rangeStart = getZonedDayRangeForInstant(
      monthStart,
      placeTimeZone,
    ).start;
    return rangeStart < todayRange.start ? todayRange.start : rangeStart;
  }, [monthStart, placeTimeZone, todayRange.start]);
  const monthRangeEnd = React.useMemo(() => {
    const rangeEnd = getZonedDayRangeForInstant(monthEnd, placeTimeZone).end;
    const maxRangeEnd = getZonedDayRangeForInstant(maxDate, placeTimeZone).end;
    return rangeEnd > maxRangeEnd ? maxRangeEnd : rangeEnd;
  }, [maxDate, monthEnd, placeTimeZone]);
  const monthRangeStartIso = React.useMemo(
    () => toUtcISOString(monthRangeStart),
    [monthRangeStart],
  );
  const monthRangeEndIso = React.useMemo(
    () => toUtcISOString(monthRangeEnd),
    [monthRangeEnd],
  );

  const [durationMinutes, setDurationMinutes] = React.useState(
    DEFAULT_DURATION_MINUTES,
  );
  const durationHours = durationMinutes / 60;
  const [durationHoursDraft, setDurationHoursDraft] = React.useState(
    String(durationHours),
  );
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>();

  const commitDurationHours = React.useCallback(
    (hours: number) => {
      const clampedHours = clampDurationHours(hours);
      const nextMinutes = clampedHours * 60;
      if (nextMinutes !== durationMinutes) {
        setDurationMinutes(nextMinutes);
        setSelectedSlotId(undefined);
      }
      setDurationHoursDraft(String(clampedHours));
    },
    [durationMinutes],
  );

  React.useEffect(() => {
    setDurationHoursDraft(String(durationMinutes / 60));
  }, [durationMinutes]);

  const handleDurationDraftChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDurationHoursDraft(value);
      if (!value) return;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return;
      if (parsed < MIN_DURATION_HOURS || parsed > MAX_DURATION_HOURS) return;
      commitDurationHours(parsed);
    },
    [commitDurationHours],
  );

  const handleDurationBlur = React.useCallback(() => {
    if (!durationHoursDraft.trim()) {
      commitDurationHours(MIN_DURATION_HOURS);
      return;
    }
    const parsed = Number(durationHoursDraft);
    if (!Number.isFinite(parsed)) {
      commitDurationHours(MIN_DURATION_HOURS);
      return;
    }
    commitDurationHours(parsed);
  }, [commitDurationHours, durationHoursDraft]);

  const handleDurationStep = React.useCallback(
    (direction: "increase" | "decrease") => {
      const draftValue = durationHoursDraft.trim();
      const parsed = Number(draftValue);
      const baseHours =
        draftValue !== "" && Number.isFinite(parsed) && Number.isInteger(parsed)
          ? parsed
          : durationHours;
      const nextHours =
        direction === "increase" ? baseHours + 1 : baseHours - 1;
      commitDurationHours(nextHours);
    },
    [commitDurationHours, durationHours, durationHoursDraft],
  );

  const availabilityQuery = trpc.availability.getForCourtRange.useQuery(
    {
      courtId,
      startDate: monthRangeStartIso,
      endDate: monthRangeEndIso,
      durationMinutes,
    },
    {
      enabled: Boolean(courtId) && durationMinutes > 0,
    },
  );

  const monthAvailabilityByDay = React.useMemo<MonthDayAvailability[]>(() => {
    const slotsByDay = new Map<string, TimeSlot[]>();
    for (const option of availabilityQuery.data ?? []) {
      const dayKey = getZonedDayKey(option.startTime, placeTimeZone);
      const slot: TimeSlot = {
        id: buildAvailabilityId(
          option.courtId,
          option.startTime,
          durationMinutes,
        ),
        startTime: option.startTime,
        endTime: option.endTime,
        priceCents: option.totalPriceCents,
        currency: option.currency ?? "PHP",
        status: "available",
      };

      const existing = slotsByDay.get(dayKey);
      if (existing) {
        existing.push(slot);
      } else {
        slotsByDay.set(dayKey, [slot]);
      }
    }

    return Array.from(slotsByDay.entries())
      .map(([dayKey, slots]) => ({
        dayKey,
        date: parseDayKeyToDate(dayKey, placeTimeZone),
        slots: [...slots].sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        ),
      }))
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [availabilityQuery.data, durationMinutes, placeTimeZone]);

  const availableMonthDates = React.useMemo(
    () => monthAvailabilityByDay.map((day) => day.date),
    [monthAvailabilityByDay],
  );

  const scrollToDayKey = React.useCallback((dayKey: string) => {
    if (typeof window === "undefined") return;
    const element = document.getElementById(`day-${dayKey}`);
    if (!element) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const handleMonthSelect = React.useCallback(
    (date?: Date) => {
      if (!date) return;
      setSelectedDate(date);
      scrollToDayKey(getZonedDayKey(date, placeTimeZone));
    },
    [placeTimeZone, scrollToDayKey],
  );

  const handleMonthChange = React.useCallback((date: Date) => {
    setMonthStart(startOfMonth(date));
  }, []);

  const handleMonthToday = React.useCallback(() => {
    setMonthStart(startOfMonth(today));
    setSelectedDate(today);
    scrollToDayKey(getZonedDayKey(today, placeTimeZone));
  }, [placeTimeZone, scrollToDayKey, today]);

  if (orgLoading || courtLoading || placeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData || !placeData) {
    router.push(appRoutes.owner.places.courts.base(placeId));
    return null;
  }

  const scheduleHref = appRoutes.owner.places.courts.schedule(placeId, courtId);
  const reservationsHref = `${appRoutes.owner.reservations}?placeId=${placeId}&courtId=${courtId}`;

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-muted-foreground">
        No available start times for this month.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href={scheduleHref}>Edit schedule & pricing</Link>
      </Button>
    </div>
  );

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title={`Availability · ${courtData.court.label}`}
          description="Schedule-derived availability based on hours, pricing, blocks, and reservations."
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Availability" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={scheduleHref}>Edit schedule</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={reservationsHref}>View bookings</Link>
              </Button>
            </>
          }
        />

        <Card>
          <CardContent className="space-y-4 p-6">
            {availabilityQuery.error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load availability</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-col gap-2">
                    <p>
                      Something went wrong while loading availability. Please
                      try again.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => availabilityQuery.refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <div className="space-y-2">
                  <InputGroup className="max-w-[240px]">
                    <InputGroupButton
                      type="button"
                      size="icon-sm"
                      aria-label="Decrease duration"
                      onClick={() => handleDurationStep("decrease")}
                      disabled={durationHours <= MIN_DURATION_HOURS}
                    >
                      <Minus className="h-4 w-4" />
                    </InputGroupButton>
                    <InputGroupInput
                      type="number"
                      inputMode="numeric"
                      min={MIN_DURATION_HOURS}
                      max={MAX_DURATION_HOURS}
                      step={1}
                      value={durationHoursDraft}
                      onChange={handleDurationDraftChange}
                      onBlur={handleDurationBlur}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      className="text-center"
                      aria-label="Duration in hours"
                    />
                    <InputGroupText className="px-2">hours</InputGroupText>
                    <InputGroupButton
                      type="button"
                      size="icon-sm"
                      aria-label="Increase duration"
                      onClick={() => handleDurationStep("increase")}
                      disabled={durationHours >= MAX_DURATION_HOURS}
                    >
                      <Plus className="h-4 w-4" />
                    </InputGroupButton>
                  </InputGroup>
                  <p className="text-xs text-muted-foreground">
                    Availability is capped to {MAX_BOOKING_WINDOW_DAYS} days.
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:justify-self-end">
                <p className="text-sm font-medium">Time zone</p>
                <p className="text-sm text-muted-foreground">{placeTimeZone}</p>
              </div>
            </div>

            <AvailabilityMonthView
              selectedDate={selectedDate}
              month={monthStart}
              fromMonth={minMonthStart}
              toMonth={maxMonthStart}
              minDate={todayRange.start}
              maxDate={maxDate}
              availableDates={availableMonthDates}
              days={monthAvailabilityByDay}
              selectedSlotId={selectedSlotId}
              isLoading={availabilityQuery.isLoading}
              timeZone={placeTimeZone}
              onSelectDate={handleMonthSelect}
              onMonthChange={handleMonthChange}
              onToday={handleMonthToday}
              onSelectSlot={({ dayKey, slot }) => {
                setSelectedDate(parseDayKeyToDate(dayKey, placeTimeZone));
                setSelectedSlotId(slot.id);
              }}
              emptyState={emptyState}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
