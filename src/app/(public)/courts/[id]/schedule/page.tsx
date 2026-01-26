"use client";

import { addDays, endOfMonth, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import * as React from "react";
import { AvailabilityEmptyState } from "@/components/availability-empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth";
import {
  usePlaceAvailability,
  usePlaceDetail,
} from "@/features/discovery/hooks";
import { cn } from "@/lib/utils";
import {
  AvailabilityMonthView,
  KudosDatePicker,
  type TimeSlot,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
} from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/shared/lib/booking-window";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import { normalizeDurationMinutes } from "@/shared/lib/duration";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/shared/lib/format";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedDayRangeFromDayKey,
  getZonedStartOfDayIso,
  getZonedToday,
  toUtcISOString,
} from "@/shared/lib/time-zone";
import { trpc } from "@/trpc/client";

const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 24;
const DEFAULT_DURATION_MINUTES = 60;
const selectionModeSchema = ["any", "court"] as const;
const viewModeSchema = ["day", "month"] as const;
const clampDurationHours = (value: number) =>
  Math.min(Math.max(Math.round(value), MIN_DURATION_HOURS), MAX_DURATION_HOURS);

type SelectionMode = (typeof selectionModeSchema)[number];
type ViewMode = (typeof viewModeSchema)[number];

type CourtAvailabilityOption = {
  id?: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
  status?: "AVAILABLE" | "BOOKED";
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
  courtOptions?: CourtOption[];
};

type CourtOption = {
  courtId: string;
  courtLabel: string;
  status: "AVAILABLE" | "BOOKED";
  totalPriceCents: number;
  currency: string | null;
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN" | null;
};

type MonthDayAvailability = {
  dayKey: string;
  date: Date;
  slots: TimeSlot[];
};

function parseDayKeyToDate(dayKey: string, timeZone?: string) {
  const range = getZonedDayRangeFromDayKey(dayKey, timeZone);
  return range.start;
}

function getMonthKeyFromDate(date: Date, timeZone?: string) {
  return formatInTimeZone(date, timeZone ?? "Asia/Manila", "yyyy-MM");
}

function parseMonthKeyToDate(monthKey: string, timeZone?: string) {
  return parseDayKeyToDate(`${monthKey}-01`, timeZone);
}

function isValidMonthKey(value?: string | null): value is string {
  if (!value) return false;
  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return false;
  return month >= 1 && month <= 12;
}

function buildSchedulePath({
  placeId,
  dayKey,
  duration,
  sportId,
  mode,
  view,
  month,
  selectedCourtId,
  startTime,
}: {
  placeId: string;
  dayKey?: string;
  duration?: number;
  sportId?: string;
  mode?: SelectionMode;
  view?: ViewMode;
  month?: string;
  selectedCourtId?: string;
  startTime?: string;
}) {
  const params = new URLSearchParams();
  if (dayKey) params.set("date", dayKey);
  if (duration) params.set("duration", String(duration));
  if (sportId) params.set("sportId", sportId);
  if (mode) params.set("mode", mode);
  if (view) params.set("view", view);
  if (month) params.set("month", month);
  if (selectedCourtId) params.set("courtId", selectedCourtId);
  if (startTime) params.set("startTime", startTime);

  const query = params.toString();
  return query
    ? `${appRoutes.places.schedule(placeId)}?${query}`
    : appRoutes.places.schedule(placeId);
}

function buildAvailabilityId(
  courtId: string,
  startTime: string,
  duration: number,
) {
  return `${courtId}-${startTime}-${duration}`;
}

type AvailabilityErrorInfo = {
  isBookingWindowError: boolean;
  isError: boolean;
  refetch: () => void;
};

function getAvailabilityErrorInfo(
  error: unknown,
  refetch: () => void,
): AvailabilityErrorInfo {
  if (!error) {
    return { isBookingWindowError: false, isError: false, refetch };
  }

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  if (isRecord(error)) {
    const data = isRecord(error.data) ? error.data : null;
    if (data?.code === "BOOKING_WINDOW_EXCEEDED") {
      return { isBookingWindowError: true, isError: true, refetch };
    }

    const message = error.message;
    if (
      typeof message === "string" &&
      message.includes("beyond the maximum booking window")
    ) {
      return { isBookingWindowError: true, isError: true, refetch };
    }
  }

  return { isBookingWindowError: false, isError: true, refetch };
}

export default function CourtSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const placeIdOrSlug = (params.placeId ??
    params.id ??
    params.courtId) as string;

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const [dayKeyParam, setDayKeyParam] = useQueryState("date", parseAsString);
  const [viewParam, setViewParam] = useQueryState(
    "view",
    parseAsStringLiteral(viewModeSchema)
      .withDefault("month")
      .withOptions({ history: "replace" }),
  );
  const [monthParam, setMonthParam] = useQueryState(
    "month",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [sportIdParam, setSportIdParam] = useQueryState(
    "sportId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [modeParam, setModeParam] = useQueryState(
    "mode",
    parseAsStringLiteral(selectionModeSchema)
      .withDefault("any")
      .withOptions({ history: "replace" }),
  );
  const [selectedCourtIdParam, setSelectedCourtIdParam] = useQueryState(
    "courtId",
    parseAsString.withOptions({ history: "replace" }),
  );
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

  const durationMinutes = normalizeDurationMinutes(
    durationParam,
    DEFAULT_DURATION_MINUTES,
  );
  const [durationHoursDraft, setDurationHoursDraft] = React.useState(
    String(durationMinutes / 60),
  );
  const durationHours = durationMinutes / 60;

  const commitDurationHours = React.useCallback(
    (hours: number) => {
      const clampedHours = clampDurationHours(hours);
      const nextMinutes = clampedHours * 60;
      if (nextMinutes !== durationMinutes) {
        setDurationParam(nextMinutes);
        setStartTimeParam(null);
      }
      setDurationHoursDraft(String(clampedHours));
    },
    [durationMinutes, setDurationParam, setStartTimeParam],
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

  const placeQuery = usePlaceDetail({ placeIdOrSlug });
  const placeSlugOrId =
    placeQuery.data?.slug ?? placeQuery.data?.id ?? placeIdOrSlug;
  const analyticsPlaceId = placeQuery.data?.id ?? placeIdOrSlug;
  const place = placeQuery.data;
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";
  const verificationStatus = place?.verification?.status ?? "UNVERIFIED";
  const reservationsEnabled = place?.verification?.reservationsEnabled ?? false;
  const isVerified = verificationStatus === "VERIFIED";
  const showBooking =
    place?.placeType === "RESERVABLE" && isVerified && reservationsEnabled;
  const isMonthView = viewParam === "month";

  React.useEffect(() => {
    if (!place?.slug) return;
    if (placeIdOrSlug === place.slug) return;
    const nextPath = buildSchedulePath({
      placeId: place.slug,
      dayKey: dayKeyParam ?? undefined,
      duration: durationMinutes,
      sportId: sportIdParam ?? undefined,
      mode: modeParam ?? undefined,
      view: viewParam,
      month: isValidMonthKey(monthParam) ? monthParam : undefined,
      selectedCourtId: selectedCourtIdParam ?? undefined,
      startTime: startTimeParam ?? undefined,
    });
    router.replace(nextPath);
  }, [
    dayKeyParam,
    durationMinutes,
    modeParam,
    monthParam,
    place?.slug,
    placeIdOrSlug,
    router,
    selectedCourtIdParam,
    sportIdParam,
    startTimeParam,
    viewParam,
  ]);

  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const maxDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const maxMonthStart = React.useMemo(() => startOfMonth(maxDate), [maxDate]);
  const maxMonthKey = React.useMemo(
    () => getMonthKeyFromDate(maxDate, placeTimeZone),
    [maxDate, placeTimeZone],
  );
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const todayRange = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const currentMonthKey = React.useMemo(
    () => getMonthKeyFromDate(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const minMonthStart = React.useMemo(() => startOfMonth(today), [today]);

  const selectedDate = React.useMemo(() => {
    if (!dayKeyParam) return undefined;
    return parseDayKeyToDate(dayKeyParam, placeTimeZone);
  }, [dayKeyParam, placeTimeZone]);

  React.useEffect(() => {
    if (!place) return;

    if (!sportIdParam) {
      setSportIdParam(place.sports[0]?.id ?? null);
    }

    if (!dayKeyParam) {
      setDayKeyParam(todayDayKey);
    } else if (selectedDate) {
      const selectedRange = getZonedDayRangeForInstant(
        selectedDate,
        placeTimeZone,
      );
      if (selectedRange.start < todayRange.start) {
        setDayKeyParam(todayDayKey);
      }
    }

    if (!isValidMonthKey(monthParam)) {
      const fallbackMonthKey = getMonthKeyFromDate(
        selectedDate ?? today,
        placeTimeZone,
      );
      setMonthParam(fallbackMonthKey);
      return;
    }

    const monthStart = parseMonthKeyToDate(monthParam, placeTimeZone);
    if (monthStart < minMonthStart) {
      setMonthParam(currentMonthKey);
    } else if (monthStart > maxMonthStart) {
      setMonthParam(maxMonthKey);
    }
  }, [
    currentMonthKey,
    dayKeyParam,
    maxMonthKey,
    maxMonthStart,
    minMonthStart,
    monthParam,
    place,
    placeTimeZone,
    selectedDate,
    setDayKeyParam,
    setMonthParam,
    setSportIdParam,
    sportIdParam,
    today,
    todayDayKey,
    todayRange.start,
  ]);

  const courtsForSport = React.useMemo(() => {
    if (!place || !sportIdParam) return [];

    return place.courts
      .filter((court) => court.sportId === sportIdParam)
      .filter((court) => court.isActive);
  }, [place, sportIdParam]);

  React.useEffect(() => {
    if (modeParam !== "court") return;
    if (selectedCourtIdParam) return;
    if (!courtsForSport.length) return;

    setSelectedCourtIdParam(courtsForSport[0]?.id ?? null);
  }, [
    courtsForSport,
    modeParam,
    selectedCourtIdParam,
    setSelectedCourtIdParam,
  ]);

  const dayViewDate = isMonthView ? undefined : selectedDate;

  const dayViewDateIso = React.useMemo(() => {
    if (!dayViewDate) return undefined;
    return getZonedStartOfDayIso(dayViewDate, placeTimeZone);
  }, [dayViewDate, placeTimeZone]);

  const resolvedMonthKey = isValidMonthKey(monthParam)
    ? monthParam
    : currentMonthKey;
  const monthStart = React.useMemo(
    () => parseMonthKeyToDate(resolvedMonthKey, placeTimeZone),
    [placeTimeZone, resolvedMonthKey],
  );
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
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setDayKeyParam(nextDayKey);
      setMonthParam(getMonthKeyFromDate(date, placeTimeZone));
      setStartTimeParam(null);
      scrollToDayKey(nextDayKey);
    },
    [
      placeTimeZone,
      scrollToDayKey,
      setDayKeyParam,
      setMonthParam,
      setStartTimeParam,
    ],
  );

  const handleMonthChange = React.useCallback(
    (date: Date) => {
      const nextMonthKey = getMonthKeyFromDate(date, placeTimeZone);
      const nextMonthStart = parseMonthKeyToDate(nextMonthKey, placeTimeZone);
      const nextDayKey =
        nextMonthStart < todayRange.start
          ? todayDayKey
          : getZonedDayKey(nextMonthStart, placeTimeZone);
      setMonthParam(nextMonthKey);
      setDayKeyParam(nextDayKey);
      setStartTimeParam(null);
    },
    [
      placeTimeZone,
      setDayKeyParam,
      setMonthParam,
      setStartTimeParam,
      todayDayKey,
      todayRange.start,
    ],
  );

  const handleMonthToday = React.useCallback(() => {
    setMonthParam(currentMonthKey);
    setDayKeyParam(todayDayKey);
    setStartTimeParam(null);
    scrollToDayKey(todayDayKey);
  }, [
    currentMonthKey,
    scrollToDayKey,
    setDayKeyParam,
    setMonthParam,
    setStartTimeParam,
    todayDayKey,
  ]);

  const handleViewChange = React.useCallback(
    (value: string) => {
      if (!value) return;
      const nextView = value as ViewMode;
      setViewParam(nextView);
      setStartTimeParam(null);

      if (nextView === "month") {
        const baseDate = selectedDate ?? today;
        const nextMonthKey = getMonthKeyFromDate(baseDate, placeTimeZone);
        setMonthParam(nextMonthKey);
      }
    },
    [
      placeTimeZone,
      selectedDate,
      setMonthParam,
      setStartTimeParam,
      setViewParam,
      today,
    ],
  );

  const cheapestAvailabilityQuery = usePlaceAvailability({
    place: modeParam === "any" ? (place ?? undefined) : undefined,
    sportId: sportIdParam ?? undefined,
    courtId: undefined,
    date: dayViewDate,
    durationMinutes,
    mode: "any",
    includeUnavailable: true,
    includeCourtOptions: true,
  });

  const cheapestAvailability = cheapestAvailabilityQuery.data ?? [];
  const availabilityDiagnostics = cheapestAvailabilityQuery.diagnostics;

  const courtAvailabilityQuery = trpc.availability.getForCourts.useQuery(
    {
      courtIds: courtsForSport.map((court) => court.id),
      date: dayViewDateIso ?? "",
      durationMinutes,
      includeUnavailable: true,
    },
    {
      enabled:
        !isMonthView &&
        modeParam === "court" &&
        !!dayViewDateIso &&
        courtsForSport.length > 0,
    },
  );

  const monthAvailabilityQuery =
    trpc.availability.getForPlaceSportRange.useQuery(
      {
        placeId: place?.id ?? "",
        sportId: sportIdParam ?? "",
        startDate: monthRangeStartIso,
        endDate: monthRangeEndIso,
        durationMinutes,
        includeUnavailable: true,
        includeCourtOptions: true,
      },
      {
        enabled:
          isMonthView &&
          modeParam === "any" &&
          !!place?.id &&
          !!sportIdParam &&
          durationMinutes > 0,
      },
    );

  const courtMonthAvailabilityQuery =
    trpc.availability.getForCourtRange.useQuery(
      {
        courtId: selectedCourtIdParam ?? "",
        startDate: monthRangeStartIso,
        endDate: monthRangeEndIso,
        durationMinutes,
        includeUnavailable: true,
      },
      {
        enabled:
          isMonthView &&
          modeParam === "court" &&
          !!selectedCourtIdParam &&
          durationMinutes > 0,
      },
    );

  const monthAvailabilityOptions = React.useMemo(() => {
    if (!isMonthView) return [];
    const responseData =
      modeParam === "any"
        ? monthAvailabilityQuery.data
        : courtMonthAvailabilityQuery.data;
    const options = responseData?.options ?? [];
    return options.map((option) => ({
      ...option,
      id: buildAvailabilityId(
        option.courtId,
        option.startTime,
        durationMinutes,
      ),
    }));
  }, [
    courtMonthAvailabilityQuery.data,
    durationMinutes,
    isMonthView,
    modeParam,
    monthAvailabilityQuery.data,
  ]);

  const monthAvailabilityDiagnostics = React.useMemo(() => {
    if (!isMonthView) return null;
    const responseData =
      modeParam === "any"
        ? monthAvailabilityQuery.data
        : courtMonthAvailabilityQuery.data;
    return responseData?.diagnostics ?? null;
  }, [
    courtMonthAvailabilityQuery.data,
    isMonthView,
    modeParam,
    monthAvailabilityQuery.data,
  ]);

  const isLoadingCourtAvailability = courtAvailabilityQuery.isLoading;

  const activeAvailabilityError = React.useMemo<AvailabilityErrorInfo>(() => {
    if (isMonthView) {
      const query =
        modeParam === "any"
          ? monthAvailabilityQuery
          : courtMonthAvailabilityQuery;
      return getAvailabilityErrorInfo(query.error, query.refetch);
    }

    const query =
      modeParam === "any" ? cheapestAvailabilityQuery : courtAvailabilityQuery;
    return getAvailabilityErrorInfo(query.error, query.refetch);
  }, [
    cheapestAvailabilityQuery,
    courtAvailabilityQuery,
    courtMonthAvailabilityQuery,
    isMonthView,
    modeParam,
    monthAvailabilityQuery,
  ]);

  const maxDayKey = React.useMemo(
    () => getZonedDayKey(maxDate, placeTimeZone),
    [maxDate, placeTimeZone],
  );

  const handleJumpToMaxDate = React.useCallback(() => {
    setDayKeyParam(maxDayKey);
    setMonthParam(maxMonthKey);
    setStartTimeParam(null);
  }, [
    maxDayKey,
    maxMonthKey,
    setDayKeyParam,
    setMonthParam,
    setStartTimeParam,
  ]);

  const courtAvailabilityById = React.useMemo(() => {
    const grouped: Record<string, CourtAvailabilityOption[]> = {};
    const options = courtAvailabilityQuery.data?.options ?? [];
    for (const option of options) {
      if (!grouped[option.courtId]) {
        grouped[option.courtId] = [];
      }
      grouped[option.courtId]?.push(option);
    }
    for (const opts of Object.values(grouped)) {
      opts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [courtAvailabilityQuery.data]);

  const selectedOption: CourtAvailabilityOption | undefined =
    React.useMemo(() => {
      if (!startTimeParam) return undefined;

      if (isMonthView) {
        return monthAvailabilityOptions.find(
          (option) => option.startTime === startTimeParam,
        );
      }

      if (modeParam === "any") {
        return cheapestAvailability.find(
          (option) => option.startTime === startTimeParam,
        );
      }

      if (!selectedCourtIdParam) return undefined;

      const options = courtAvailabilityById[selectedCourtIdParam] ?? [];
      return options.find((option) => option.startTime === startTimeParam);
    }, [
      cheapestAvailability,
      courtAvailabilityById,
      isMonthView,
      modeParam,
      monthAvailabilityOptions,
      selectedCourtIdParam,
      startTimeParam,
    ]);

  const selectedOptionId = selectedOption
    ? buildAvailabilityId(
        selectedOption.courtId,
        selectedOption.startTime,
        durationMinutes,
      )
    : undefined;

  const monthAvailabilityByDay = React.useMemo<MonthDayAvailability[]>(() => {
    if (!isMonthView) return [];
    const slotsByDay = new Map<string, TimeSlot[]>();

    for (const option of monthAvailabilityOptions) {
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
        status: option.status === "BOOKED" ? "booked" : "available",
        unavailableReason: option.unavailableReason ?? undefined,
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
  }, [durationMinutes, isMonthView, monthAvailabilityOptions, placeTimeZone]);

  const availableMonthDates = React.useMemo(
    () =>
      monthAvailabilityByDay
        .filter((day) => day.slots.some((slot) => slot.status === "available"))
        .map((day) => day.date),
    [monthAvailabilityByDay],
  );

  const courtOptionsByStartTime = React.useMemo(() => {
    if (modeParam !== "any") return new Map<string, CourtOption[]>();
    const source = isMonthView
      ? monthAvailabilityOptions
      : cheapestAvailability;
    const map = new Map<string, CourtOption[]>();
    for (const option of source) {
      if (!option.courtOptions || option.courtOptions.length === 0) continue;
      map.set(option.startTime, option.courtOptions);
    }
    return map;
  }, [cheapestAvailability, isMonthView, modeParam, monthAvailabilityOptions]);

  const renderCourtOptions = React.useCallback(
    (slot: TimeSlot) => {
      if (modeParam !== "any") return null;
      const options = courtOptionsByStartTime.get(slot.startTime);
      if (!options || options.length === 0) return null;
      return (
        <div className="w-full rounded-md border border-dashed bg-muted/40 px-2 py-1 text-[11px]">
          <div className="space-y-1">
            {options.map((option) => {
              const statusLabel =
                option.status === "AVAILABLE"
                  ? "Available"
                  : option.unavailableReason === "MAINTENANCE"
                    ? "Maintenance"
                    : "Booked";
              return (
                <div
                  key={option.courtId}
                  className="flex items-center justify-between gap-2"
                >
                  <span
                    className={cn(
                      "truncate",
                      option.status === "AVAILABLE"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {option.courtLabel}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide",
                      option.status === "AVAILABLE"
                        ? "text-success"
                        : option.unavailableReason === "MAINTENANCE"
                          ? "text-warning"
                          : "text-muted-foreground",
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [courtOptionsByStartTime, modeParam],
  );

  const renderMonthSlotAction = React.useCallback(
    ({ slot }: { slot: TimeSlot }) => renderCourtOptions(slot),
    [renderCourtOptions],
  );

  React.useEffect(() => {
    if (!selectedOption) return;

    trackEvent({
      event: "funnel.schedule_slot_selected",
      properties: {
        placeId: analyticsPlaceId,
        mode: modeParam,
        durationMinutes,
        startTime: selectedOption.startTime,
        courtId: selectedOption.courtId,
      },
    });
  }, [analyticsPlaceId, durationMinutes, modeParam, selectedOption]);

  const handleReserve = () => {
    if (!selectedOption || !sportIdParam) return;

    trackEvent({
      event: "funnel.reserve_clicked",
      properties: {
        placeId: analyticsPlaceId,
        mode: modeParam,
        durationMinutes,
        startTime: selectedOption.startTime,
        courtId: selectedOption.courtId,
      },
    });

    const bookingParams = new URLSearchParams({
      startTime: selectedOption.startTime,
      duration: String(durationMinutes),
      sportId: sportIdParam,
      mode: modeParam,
    });

    if (modeParam === "court") {
      bookingParams.set("courtId", selectedOption.courtId);
    }

    const destination = `${appRoutes.places.book(placeSlugOrId)}?${bookingParams.toString()}`;

    if (isAuthenticated) {
      router.push(destination);
      return;
    }

    const returnTo = buildSchedulePath({
      placeId: placeSlugOrId,
      dayKey: dayKeyParam ?? undefined,
      duration: durationMinutes,
      sportId: sportIdParam,
      mode: modeParam,
      view: viewParam,
      month: isValidMonthKey(monthParam) ? monthParam : undefined,
      selectedCourtId:
        modeParam === "court" ? selectedOption.courtId : undefined,
      startTime: selectedOption.startTime,
    });

    trackEvent({
      event: "funnel.login_started",
      properties: {
        placeId: analyticsPlaceId,
        redirect: returnTo,
      },
    });

    router.push(appRoutes.login.from(returnTo));
  };

  if (placeQuery.isLoading) {
    return (
      <Container className="py-12">
        <div className="space-y-4">
          <div className="h-8 w-56 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          <div className="h-80 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </Container>
    );
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Court not found</h1>
          <p className="text-muted-foreground mt-2">
            The court you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href={appRoutes.places.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Browse all courts
          </Link>
        </div>
      </Container>
    );
  }

  if (!showBooking) {
    const heading =
      place.placeType === "RESERVABLE"
        ? "Bookings not available yet"
        : "Not bookable yet";
    const description =
      place.placeType === "RESERVABLE"
        ? "This venue must be verified and enabled by the owner before bookings open."
        : "This listing doesn&apos;t have a public booking schedule yet.";

    return (
      <Container className="py-12">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-muted-foreground">{description}</p>
          <Button asChild variant="outline" className="mx-auto">
            <Link href={appRoutes.places.detail(placeSlugOrId)}>
              Back to details
            </Link>
          </Button>
        </div>
      </Container>
    );
  }

  const formattedDateLabel = selectedDate
    ? formatInTimeZone(selectedDate, placeTimeZone, "MMM d, yyyy")
    : "";

  const isLoadingMonthAvailability =
    isMonthView &&
    (modeParam === "any"
      ? monthAvailabilityQuery.isLoading
      : courtMonthAvailabilityQuery.isLoading);

  const isLoadingTimes = isMonthView
    ? isLoadingMonthAvailability
    : modeParam === "any"
      ? cheapestAvailabilityQuery.isLoading
      : isLoadingCourtAvailability;

  const cheapestSlots: TimeSlot[] = cheapestAvailability.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    priceCents: slot.totalPriceCents,
    currency: slot.currency,
    status: slot.status === "BOOKED" ? "booked" : "available",
    unavailableReason: slot.unavailableReason ?? undefined,
  }));

  return (
    <Container className="py-6">
      <div className="space-y-6 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={appRoutes.places.detail(placeSlugOrId)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to details
              </Link>
            </Button>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {place.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              View availability in a denser layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={appRoutes.places.detail(placeSlugOrId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open details
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Schedule</CardTitle>
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Detailed view
              </Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium">Sport</p>
                <ToggleGroup
                  type="single"
                  value={sportIdParam ?? undefined}
                  onValueChange={(value) => {
                    setSportIdParam(value || null);
                    setSelectedCourtIdParam(null);
                    setStartTimeParam(null);
                  }}
                >
                  {place.sports.map((sport) => (
                    <ToggleGroupItem key={sport.id} value={sport.id} size="sm">
                      {sport.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Calendar view</p>
                <ToggleGroup
                  type="single"
                  value={viewParam}
                  onValueChange={handleViewChange}
                >
                  <ToggleGroupItem value="month" size="sm">
                    Month
                  </ToggleGroupItem>
                  <ToggleGroupItem value="day" size="sm">
                    Day
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                  <p className="text-xs text-muted-foreground">1-24 hours</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">View</p>
                <ToggleGroup
                  type="single"
                  value={modeParam}
                  onValueChange={(value) => {
                    if (!value) return;
                    setModeParam(value as SelectionMode);
                    setStartTimeParam(null);
                    if (value === "any") {
                      setSelectedCourtIdParam(null);
                    }
                  }}
                >
                  <ToggleGroupItem value="any" size="sm">
                    Best price
                  </ToggleGroupItem>
                  <ToggleGroupItem value="court" size="sm">
                    By court
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {!isMonthView ? (
              <div className="space-y-2 max-w-[260px]">
                <p className="text-sm font-medium">Date</p>
                <KudosDatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    if (!date) {
                      setDayKeyParam(null);
                      setStartTimeParam(null);
                      return;
                    }
                    const nextDayKey = getZonedDayKey(date, placeTimeZone);
                    setDayKeyParam(nextDayKey);
                    setMonthParam(getMonthKeyFromDate(date, placeTimeZone));
                    setStartTimeParam(null);
                  }}
                  placeholder="Choose a date"
                  maxDate={maxDate}
                  timeZone={placeTimeZone}
                />
              </div>
            ) : modeParam === "court" ? (
              <div className="space-y-2 max-w-[320px]">
                <p className="text-sm font-medium">Court</p>
                <Select
                  value={selectedCourtIdParam ?? ""}
                  onValueChange={(value) => {
                    setSelectedCourtIdParam(value || null);
                    setStartTimeParam(null);
                  }}
                  disabled={!courtsForSport.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courtsForSport.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            {activeAvailabilityError.isError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {activeAvailabilityError.isBookingWindowError
                    ? "Date beyond booking window"
                    : "Failed to load availability"}
                </AlertTitle>
                <AlertDescription>
                  {activeAvailabilityError.isBookingWindowError ? (
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
                        onClick={() => activeAvailabilityError.refetch()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <CalendarIcon className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {formattedDateLabel || "Pick a date"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {modeParam === "any"
                      ? "Best price aggregates all courts. Switch to By court to see blocked times."
                      : "Pick a start time under any court."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {modeParam === "any" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setModeParam("court")}
                  >
                    View by court
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setStartTimeParam(null)}
                  disabled={!startTimeParam}
                >
                  Clear selection
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReserve}
                  disabled={!selectedOption}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedOption ? "Continue to review" : "Select a time"}
                </Button>
              </div>
            </div>

            {isMonthView ? (
              <AvailabilityMonthView
                selectedDate={selectedDate}
                month={monthStart}
                fromMonth={minMonthStart}
                toMonth={maxMonthStart}
                minDate={todayRange.start}
                maxDate={maxDate}
                availableDates={availableMonthDates}
                days={monthAvailabilityByDay}
                selectedSlotId={selectedOptionId}
                isLoading={
                  isLoadingTimes &&
                  !(modeParam === "court" && courtsForSport.length === 0)
                }
                timeZone={placeTimeZone}
                renderSlotAction={
                  modeParam === "any" ? renderMonthSlotAction : undefined
                }
                onSelectDate={handleMonthSelect}
                onMonthChange={handleMonthChange}
                onToday={handleMonthToday}
                onSelectSlot={({ dayKey, slot }) => {
                  setDayKeyParam(dayKey);
                  setMonthParam(dayKey.slice(0, 7));
                  setStartTimeParam(slot.startTime);
                }}
                emptyState={
                  modeParam === "court" && courtsForSport.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No active courts for this sport.
                    </p>
                  ) : (
                    <AvailabilityEmptyState
                      diagnostics={monthAvailabilityDiagnostics}
                      variant="public"
                      contact={place?.contactDetail}
                    />
                  )
                }
              />
            ) : !selectedDate ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Select a date to see available start times.
              </p>
            ) : isLoadingTimes ? (
              <TimeSlotPickerSkeleton count={8} />
            ) : modeParam === "any" ? (
              cheapestSlots.length > 0 ? (
                <TimeSlotPicker
                  slots={cheapestSlots}
                  selectedId={selectedOptionId}
                  onSelect={(slot) => setStartTimeParam(slot.startTime)}
                  showPrice
                  timeZone={placeTimeZone}
                  renderSlotAction={({ slot }) => renderCourtOptions(slot)}
                />
              ) : (
                <AvailabilityEmptyState
                  diagnostics={availabilityDiagnostics}
                  variant="public"
                  contact={place?.contactDetail}
                />
              )
            ) : courtsForSport.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No active courts for this sport.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courtsForSport.map((court) => {
                  const options = courtAvailabilityById[court.id] ?? [];

                  const slots: TimeSlot[] = options.map((option) => ({
                    id: buildAvailabilityId(
                      option.courtId,
                      option.startTime,
                      durationMinutes,
                    ),
                    startTime: option.startTime,
                    endTime: option.endTime,
                    priceCents: option.totalPriceCents,
                    currency: option.currency ?? "PHP",
                    status: option.status === "BOOKED" ? "booked" : "available",
                    unavailableReason: option.unavailableReason ?? undefined,
                  }));

                  const selectedId =
                    startTimeParam && selectedCourtIdParam === court.id
                      ? buildAvailabilityId(
                          court.id,
                          startTimeParam,
                          durationMinutes,
                        )
                      : undefined;

                  const hasSelection =
                    selectedCourtIdParam === court.id && !!startTimeParam;

                  return (
                    <Card
                      key={court.id}
                      className={
                        hasSelection
                          ? "border-primary/40 shadow-sm"
                          : "border-border/60"
                      }
                    >
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">
                            {court.label}
                          </CardTitle>
                          {hasSelection && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {place.sports.find(
                              (sport) => sport.id === sportIdParam,
                            )?.name ?? "Sport"}
                          </Badge>
                          {court.tierLabel && (
                            <Badge variant="secondary" className="text-[10px]">
                              {court.tierLabel}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {courtAvailabilityQuery.isLoading ? (
                          <TimeSlotPickerSkeleton count={8} />
                        ) : slots.length > 0 ? (
                          <TimeSlotPicker
                            slots={slots}
                            selectedId={selectedId}
                            onSelect={(slot) => {
                              setSelectedCourtIdParam(court.id);
                              setStartTimeParam(slot.startTime);
                            }}
                            showPrice
                            timeZone={placeTimeZone}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No start times.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedOption && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 shadow-lg backdrop-blur sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {formatInTimeZone(
                  new Date(selectedOption.startTime),
                  placeTimeZone,
                  "MMM d, h:mm a",
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(durationMinutes)} ·{" "}
                {formatCurrency(
                  selectedOption.totalPriceCents,
                  selectedOption.currency ?? "PHP",
                )}
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
