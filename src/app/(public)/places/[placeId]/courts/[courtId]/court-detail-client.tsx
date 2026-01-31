"use client";

import { addDays } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { trackEvent } from "@/common/clients/telemetry-client";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/common/format";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedDayRangeFromDayKey,
  getZonedStartOfDayIso,
  getZonedToday,
  toUtcISOString,
} from "@/common/time-zone";
import { AvailabilityEmptyState } from "@/components/availability-empty-state";
import {
  AvailabilityWeekGrid,
  AvailabilityWeekGridSkeleton,
  KudosDatePicker,
  TimeRangePicker,
  TimeRangePickerSkeleton,
  type TimeSlot,
} from "@/components/kudos";
import { Container } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth";
import {
  getPlaceVerificationDisplay,
  type PlaceVerificationDisplayInput,
} from "@/features/discovery/helpers";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const TIMELINE_SLOT_DURATION = 60;
const DEFAULT_DURATION_MINUTES = 60;
const WEEK_STARTS_ON = 0; // Sunday
const viewModeSchema = ["week", "day"] as const;
type ViewMode = (typeof viewModeSchema)[number];

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

function getWeekStartDayKey(dayKey: string, timeZone: string): string {
  const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  const dayOfWeek = dayStart.getDay();
  const delta = (dayOfWeek - WEEK_STARTS_ON + 7) % 7;
  const weekStart = addDays(dayStart, -delta);
  return getZonedDayKey(weekStart, timeZone);
}

function getWeekDayKeys(weekStartDayKey: string, timeZone: string): string[] {
  const start = parseDayKeyToDate(weekStartDayKey, timeZone);
  return Array.from({ length: 7 }, (_, i) =>
    getZonedDayKey(addDays(start, i), timeZone),
  );
}

interface CourtDetailClientProps {
  placeSlugOrId: string;
  placeId: string;
  placeName: string;
  placeCity: string;
  placeProvince: string;
  placeTimeZone: string;
  courtId: string;
  courtLabel: string;
  courtTierLabel?: string;
  sportId: string;
  sportName: string;
  placeType: string;
  verificationStatus: string;
  reservationsEnabled: boolean;
  contactDetail?: {
    phoneNumber?: string;
    viberInfo?: string;
    otherContactInfo?: string;
  };
}

export default function CourtDetailClient({
  placeSlugOrId,
  placeId,
  placeName,
  placeCity,
  placeProvince,
  placeTimeZone,
  courtId,
  courtLabel,
  courtTierLabel,
  sportId,
  sportName,
  placeType,
  verificationStatus,
  reservationsEnabled,
  contactDetail,
}: CourtDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const shouldReduceMotion = useReducedMotion();

  const verificationDisplay = getPlaceVerificationDisplay({
    placeType: placeType as PlaceVerificationDisplayInput["placeType"],
    verificationStatus:
      verificationStatus as PlaceVerificationDisplayInput["verificationStatus"],
    reservationsEnabled,
  });
  const showBooking = verificationDisplay.showBooking;

  // URL state
  const [viewParam, setViewParam] = useQueryState(
    "view",
    parseAsStringLiteral(viewModeSchema)
      .withDefault("week")
      .withOptions({ history: "replace" }),
  );
  const [dayKeyParam, setDayKeyParam] = useQueryState("date", parseAsString);
  const [durationParam, setDurationParam] = useQueryState(
    "duration",
    parseAsInteger
      .withDefault(DEFAULT_DURATION_MINUTES)
      .withOptions({ history: "replace" }),
  );
  const [startTimeParam, setStartTimeParam] = useQueryState(
    "startTime",
    parseAsString.withOptions({ history: "replace" }),
  );

  const durationMinutes =
    durationParam > 0 && durationParam % 60 === 0
      ? durationParam
      : DEFAULT_DURATION_MINUTES;
  const isWeekView = viewParam === "week";

  // Time zone computations
  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const maxDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const todayRange = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const maxDayKey = React.useMemo(
    () => getZonedDayKey(maxDate, placeTimeZone),
    [maxDate, placeTimeZone],
  );

  // Resolve dayKey
  const dayKey = dayKeyParam ?? todayDayKey;
  const selectedDate = React.useMemo(
    () => parseDayKeyToDate(dayKey, placeTimeZone),
    [dayKey, placeTimeZone],
  );

  // Initialize/clamp dayKey
  React.useEffect(() => {
    if (!dayKeyParam) {
      setDayKeyParam(todayDayKey);
      return;
    }
    const selectedDateRange = getZonedDayRangeForInstant(
      parseDayKeyToDate(dayKeyParam, placeTimeZone),
      placeTimeZone,
    );
    if (selectedDateRange.start < todayRange.start) {
      setDayKeyParam(todayDayKey);
    }
  }, [
    dayKeyParam,
    placeTimeZone,
    setDayKeyParam,
    todayDayKey,
    todayRange.start,
  ]);

  // Week computations
  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(dayKey, placeTimeZone),
    [dayKey, placeTimeZone],
  );
  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, placeTimeZone),
    [placeTimeZone, weekStartDayKey],
  );

  // Week range for availability query
  const weekRangeStartIso = React.useMemo(() => {
    const weekStart = parseDayKeyToDate(weekDayKeys[0], placeTimeZone);
    const clamped = weekStart < todayRange.start ? todayRange.start : weekStart;
    return toUtcISOString(clamped);
  }, [placeTimeZone, todayRange.start, weekDayKeys]);

  const weekRangeEndIso = React.useMemo(() => {
    const weekEnd = getZonedDayRangeForInstant(
      parseDayKeyToDate(weekDayKeys[6], placeTimeZone),
      placeTimeZone,
    ).end;
    const maxEnd = getZonedDayRangeForInstant(maxDate, placeTimeZone).end;
    return toUtcISOString(weekEnd > maxEnd ? maxEnd : weekEnd);
  }, [maxDate, placeTimeZone, weekDayKeys]);

  // Day view ISO
  const dayViewDateIso = React.useMemo(() => {
    if (isWeekView) return undefined;
    return getZonedStartOfDayIso(selectedDate, placeTimeZone);
  }, [isWeekView, placeTimeZone, selectedDate]);

  // Availability queries
  const dayAvailabilityQuery = trpc.availability.getForCourt.useQuery(
    {
      courtId,
      date: dayViewDateIso ?? "",
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    { enabled: !isWeekView && !!dayViewDateIso },
  );

  const weekAvailabilityQuery = trpc.availability.getForCourtRange.useQuery(
    {
      courtId,
      startDate: weekRangeStartIso,
      endDate: weekRangeEndIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    { enabled: isWeekView },
  );

  // Map options to TimeSlot[]
  const mapOptionsToSlots = React.useCallback(
    (
      options: {
        courtId: string;
        startTime: string;
        endTime: string;
        totalPriceCents: number;
        currency: string | null;
        status?: string;
        unavailableReason?: string | null;
      }[],
    ): TimeSlot[] =>
      options.map((option) => ({
        id: buildAvailabilityId(
          option.courtId,
          option.startTime,
          TIMELINE_SLOT_DURATION,
        ),
        startTime: option.startTime,
        endTime: option.endTime,
        priceCents: option.totalPriceCents,
        currency: option.currency ?? "PHP",
        status:
          option.status === "BOOKED"
            ? ("booked" as const)
            : ("available" as const),
        unavailableReason:
          (option.unavailableReason as TimeSlot["unavailableReason"]) ??
          undefined,
      })),
    [],
  );

  // Day slots
  const daySlots: TimeSlot[] = React.useMemo(() => {
    if (isWeekView) return [];
    return mapOptionsToSlots(dayAvailabilityQuery.data?.options ?? []);
  }, [dayAvailabilityQuery.data, isWeekView, mapOptionsToSlots]);

  const dayDiagnostics = React.useMemo(() => {
    if (isWeekView) return null;
    return dayAvailabilityQuery.data?.diagnostics ?? null;
  }, [dayAvailabilityQuery.data, isWeekView]);

  // Week slots grouped by dayKey
  const weekSlotsByDay = React.useMemo(() => {
    if (!isWeekView) return new Map<string, TimeSlot[]>();
    const allSlots = mapOptionsToSlots(
      weekAvailabilityQuery.data?.options ?? [],
    );
    const byDay = new Map<string, TimeSlot[]>();
    for (const slot of allSlots) {
      const dk = getZonedDayKey(slot.startTime, placeTimeZone);
      const existing = byDay.get(dk);
      if (existing) {
        existing.push(slot);
      } else {
        byDay.set(dk, [slot]);
      }
    }
    // Sort each day's slots
    for (const [, slots] of byDay) {
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return byDay;
  }, [
    isWeekView,
    mapOptionsToSlots,
    placeTimeZone,
    weekAvailabilityQuery.data,
  ]);

  // Error handling
  const activeError = React.useMemo(() => {
    const query = isWeekView ? weekAvailabilityQuery : dayAvailabilityQuery;
    const error = query.error;
    if (!error)
      return {
        isError: false,
        isBookingWindowError: false,
        refetch: query.refetch,
      };

    const isRecord = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null;

    if (isRecord(error)) {
      const data = isRecord(error.data) ? error.data : null;
      if (data?.code === "BOOKING_WINDOW_EXCEEDED") {
        return {
          isBookingWindowError: true,
          isError: true,
          refetch: query.refetch,
        };
      }
      const message = error.message;
      if (
        typeof message === "string" &&
        message.includes("beyond the maximum booking window")
      ) {
        return {
          isBookingWindowError: true,
          isError: true,
          refetch: query.refetch,
        };
      }
    }

    return {
      isBookingWindowError: false,
      isError: true,
      refetch: query.refetch,
    };
  }, [dayAvailabilityQuery, isWeekView, weekAvailabilityQuery]);

  // Selection state
  const hasSelection = !!startTimeParam && durationMinutes > 0;
  const selectedRange = React.useMemo(() => {
    if (!startTimeParam) return undefined;
    return { startTime: startTimeParam, durationMinutes };
  }, [durationMinutes, startTimeParam]);

  // Compute total price + end time for selection
  const selectionPriceInfo = React.useMemo(() => {
    if (!hasSelection || !startTimeParam) return null;
    // Find the slots containing this selection (could be day or week data)
    const allSlots = isWeekView
      ? Array.from(weekSlotsByDay.values()).flat()
      : daySlots;
    const startIdx = allSlots.findIndex((s) => s.startTime === startTimeParam);
    if (startIdx === -1) return null;
    const slotCount = durationMinutes / TIMELINE_SLOT_DURATION;
    let totalCents = 0;
    let allHavePrice = true;
    let endTime = "";
    for (
      let i = startIdx;
      i < startIdx + slotCount && i < allSlots.length;
      i++
    ) {
      if (allSlots[i].priceCents !== undefined) {
        totalCents += allSlots[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
      endTime = allSlots[i].endTime;
    }
    const currency = allSlots[startIdx].currency ?? "PHP";
    return {
      totalCents: allHavePrice ? totalCents : undefined,
      currency,
      endTime,
      startTime: startTimeParam,
    };
  }, [
    hasSelection,
    startTimeParam,
    isWeekView,
    weekSlotsByDay,
    daySlots,
    durationMinutes,
  ]);

  // Handlers
  const clearSelection = React.useCallback(() => {
    setStartTimeParam(null);
    setDurationParam(DEFAULT_DURATION_MINUTES);
  }, [setDurationParam, setStartTimeParam]);

  const handleRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      setStartTimeParam(range.startTime);
      setDurationParam(range.durationMinutes);
    },
    [setDurationParam, setStartTimeParam],
  );

  const handleViewChange = React.useCallback(
    (value: string) => {
      if (!value) return;
      setViewParam(value as ViewMode);
      clearSelection();
    },
    [clearSelection, setViewParam],
  );

  const navigateWeek = React.useCallback(
    (direction: 1 | -1) => {
      const weekStart = parseDayKeyToDate(
        weekDayKeys[0] ?? dayKey,
        placeTimeZone,
      );
      const newDate = addDays(weekStart, direction * 7);
      // Clamp to today..maxDate
      if (newDate < todayRange.start && direction === -1) return;
      const newDayKey = getZonedDayKey(newDate, placeTimeZone);
      setDayKeyParam(newDayKey);
      clearSelection();
    },
    [
      clearSelection,
      dayKey,
      placeTimeZone,
      setDayKeyParam,
      todayRange.start,
      weekDayKeys,
    ],
  );

  const handleJumpToMaxDate = React.useCallback(() => {
    setDayKeyParam(maxDayKey);
    clearSelection();
  }, [clearSelection, maxDayKey, setDayKeyParam]);

  const handleGoToToday = React.useCallback(() => {
    setDayKeyParam(todayDayKey);
    clearSelection();
  }, [clearSelection, setDayKeyParam, todayDayKey]);

  // Analytics
  React.useEffect(() => {
    if (!hasSelection || !startTimeParam) return;
    trackEvent({
      event: "funnel.schedule_slot_selected",
      properties: {
        placeId,
        mode: "court",
        durationMinutes,
        startTime: startTimeParam,
        courtId,
      },
    });
  }, [courtId, durationMinutes, hasSelection, placeId, startTimeParam]);

  const handleReserve = () => {
    if (!hasSelection || !startTimeParam) return;

    trackEvent({
      event: "funnel.reserve_clicked",
      properties: {
        placeId,
        mode: "court",
        durationMinutes,
        startTime: startTimeParam,
        courtId,
      },
    });

    const bookingParams = new URLSearchParams({
      startTime: startTimeParam,
      duration: String(durationMinutes),
      sportId,
      mode: "court",
      courtId,
    });

    const destination = `${appRoutes.places.book(placeSlugOrId)}?${bookingParams.toString()}`;

    if (isAuthenticated) {
      router.push(destination);
      return;
    }

    const currentUrl = `${pathname}?${new URLSearchParams({
      view: viewParam,
      ...(dayKeyParam ? { date: dayKeyParam } : {}),
      duration: String(durationMinutes),
      startTime: startTimeParam,
    }).toString()}`;

    trackEvent({
      event: "funnel.login_started",
      properties: { placeId, redirect: currentUrl },
    });

    router.push(appRoutes.login.from(currentUrl));
  };

  const locationLabel = [placeCity, placeProvince].filter(Boolean).join(", ");
  const isLoadingTimes = isWeekView
    ? weekAvailabilityQuery.isLoading
    : dayAvailabilityQuery.isLoading;

  const formattedDateLabel = formatInTimeZone(
    selectedDate,
    placeTimeZone,
    "MMM d, yyyy",
  );

  // Week header label
  const weekHeaderLabel = React.useMemo(() => {
    if (!isWeekView) return "";
    const start = parseDayKeyToDate(weekDayKeys[0], placeTimeZone);
    const end = parseDayKeyToDate(weekDayKeys[6], placeTimeZone);
    const startLabel = formatInTimeZone(start, placeTimeZone, "MMM d");
    const endLabel = formatInTimeZone(end, placeTimeZone, "MMM d, yyyy");
    return `${startLabel} – ${endLabel}`;
  }, [isWeekView, placeTimeZone, weekDayKeys]);

  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  if (!showBooking) {
    const heading =
      placeType === "RESERVABLE"
        ? "Bookings not available yet"
        : "Not bookable yet";
    const description =
      placeType === "RESERVABLE"
        ? "This venue must be verified and enabled by the owner before bookings open."
        : "This listing doesn't have a public booking schedule yet.";

    return (
      <Container className="py-12">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-muted-foreground">{description}</p>
          <Button asChild variant="outline" className="mx-auto">
            <Link href={appRoutes.places.detail(placeSlugOrId)}>
              Back to venue
            </Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={appRoutes.places.detail(placeSlugOrId)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to venue
              </Link>
            </Button>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {courtLabel}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{sportName}</Badge>
              {courtTierLabel && (
                <Badge variant="secondary">{courtTierLabel}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {placeName}
              {locationLabel ? ` · ${locationLabel}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={appRoutes.places.detail(placeSlugOrId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open venue details
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Availability Card */}
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Schedule</CardTitle>
              <ToggleGroup
                type="single"
                value={viewParam}
                onValueChange={handleViewChange}
              >
                <ToggleGroupItem value="week" size="sm">
                  Week
                </ToggleGroupItem>
                <ToggleGroupItem value="day" size="sm">
                  Day
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <p className="text-sm text-muted-foreground">
              Click a start time, then click an end time to select a range.
            </p>

            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-3">
              {isWeekView ? (
                <>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => navigateWeek(-1)}
                      aria-label="Previous week"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => navigateWeek(1)}
                      aria-label="Next week"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium">{weekHeaderLabel}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGoToToday}
                  >
                    Today
                  </Button>
                </>
              ) : (
                <div className="space-y-2 max-w-[260px]">
                  <KudosDatePicker
                    value={selectedDate}
                    onChange={(date) => {
                      if (!date) return;
                      const nextDayKey = getZonedDayKey(date, placeTimeZone);
                      setDayKeyParam(nextDayKey);
                      clearSelection();
                    }}
                    placeholder="Choose a date"
                    maxDate={maxDate}
                    timeZone={placeTimeZone}
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {activeError.isError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {activeError.isBookingWindowError
                    ? "Date beyond booking window"
                    : "Failed to load availability"}
                </AlertTitle>
                <AlertDescription>
                  {activeError.isBookingWindowError ? (
                    <div className="flex flex-col gap-2">
                      <p>
                        Bookings are available up to {MAX_BOOKING_WINDOW_DAYS}{" "}
                        days in advance.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={handleJumpToMaxDate}
                      >
                        Jump to the latest available date
                      </Button>
                    </div>
                  ) : (
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
                        onClick={() => activeError.refetch()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Selection bar */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                hasSelection ? "border-primary/20 bg-primary/5" : "bg-muted/30",
              )}
            >
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-heading font-semibold">
                    {hasSelection && startTimeParam
                      ? `${formatInTimeZone(
                          new Date(startTimeParam),
                          placeTimeZone,
                          "EEE, MMM d",
                        )} \u00B7 ${formatInTimeZone(
                          new Date(startTimeParam),
                          placeTimeZone,
                          "h:mm a",
                        )}\u2013${
                          selectionPriceInfo?.endTime
                            ? formatInTimeZone(
                                new Date(selectionPriceInfo.endTime),
                                placeTimeZone,
                                "h:mm a",
                              )
                            : ""
                        }`
                      : formattedDateLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasSelection
                      ? `${formatDuration(durationMinutes)}${
                          selectionPriceInfo?.totalCents !== undefined
                            ? ` \u00B7 ${formatCurrency(
                                selectionPriceInfo.totalCents,
                                selectionPriceInfo.currency,
                              )} total`
                            : ""
                        }`
                      : "Click a start time, then click an end time."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={!hasSelection}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReserve}
                  disabled={!hasSelection}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {hasSelection ? "Continue to review" : "Select a time"}
                </Button>
              </div>
            </div>

            {/* Availability views */}
            <AnimatePresence mode="wait" initial={false}>
              {isWeekView ? (
                <motion.div
                  key={`week-${weekStartDayKey}`}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -10 }}
                  transition={motionTransition}
                >
                  {isLoadingTimes ? (
                    <AvailabilityWeekGridSkeleton
                      dayKeys={weekDayKeys}
                      timeZone={placeTimeZone}
                    />
                  ) : (
                    <AvailabilityWeekGrid
                      dayKeys={weekDayKeys}
                      slotsByDay={weekSlotsByDay}
                      timeZone={placeTimeZone}
                      selectedRange={selectedRange}
                      onRangeChange={handleRangeChange}
                      onDayClick={(dk) => {
                        setDayKeyParam(dk);
                        setViewParam("day");
                        clearSelection();
                      }}
                      todayDayKey={todayDayKey}
                      maxDayKey={maxDayKey}
                    />
                  )}
                </motion.div>
              ) : !selectedDate ? (
                <motion.div
                  key="no-date"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransition}
                >
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Select a date to see available start times.
                  </p>
                </motion.div>
              ) : isLoadingTimes ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransition}
                >
                  <TimeRangePickerSkeleton count={8} />
                </motion.div>
              ) : daySlots.length > 0 ? (
                <motion.div
                  key={`day-${dayKey}`}
                  initial={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 6,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : -6,
                  }}
                  transition={motionTransition}
                >
                  <TimeRangePicker
                    slots={daySlots}
                    timeZone={placeTimeZone}
                    selectedStartTime={selectedRange?.startTime}
                    selectedDurationMinutes={selectedRange?.durationMinutes}
                    showPrice
                    onChange={handleRangeChange}
                    onClear={clearSelection}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransition}
                >
                  <AvailabilityEmptyState
                    diagnostics={dayDiagnostics}
                    variant="public"
                    contact={contactDetail}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Mobile sticky CTA */}
      {hasSelection && startTimeParam && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 shadow-lg backdrop-blur sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {formatInTimeZone(
                  new Date(startTimeParam),
                  placeTimeZone,
                  "EEE, MMM d, h:mm a",
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(durationMinutes)}
                {selectionPriceInfo?.totalCents !== undefined &&
                  ` \u00B7 ${formatCurrency(selectionPriceInfo.totalCents, selectionPriceInfo.currency)}`}
              </p>
            </div>
            <Button size="sm" onClick={handleReserve}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
