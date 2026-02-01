"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock,
  Copy,
  ExternalLink,
  Flag,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";
import { trackEvent } from "@/common/clients/telemetry-client";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/common/format";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { buildViberDeepLink, toDialablePhone } from "@/common/phone";
import { S } from "@/common/schemas";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedStartOfDayIso,
  getZonedToday,
  toUtcISOString,
} from "@/common/time-zone";
import { copyToClipboard } from "@/common/utils/clipboard";
import { AvailabilityEmptyState } from "@/components/availability-empty-state";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import {
  AvailabilityWeekGrid,
  AvailabilityWeekGridSkeleton,
  GoogleMapsEmbed,
  KudosDatePicker,
  MobileScrollThumb,
  TimeRangePicker,
  TimeRangePickerSkeleton,
  type TimeSlot,
} from "@/components/kudos";
import { Container } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth";
import {
  MobileDateStrip,
  PhotoCarousel,
} from "@/features/discovery/components";
import { VerificationStatusBanner } from "@/features/discovery/components/verification-status-banner";
import {
  buildSlotsByDayKey,
  getAvailabilityErrorInfo,
  getPlaceVerificationDisplay,
  getWeekDayKeys,
  getWeekStartDayKey,
  mapAvailabilityOptionsToSlots,
  parseDayKeyToDate,
} from "@/features/discovery/helpers";
import {
  usePlaceAvailabilitySelection,
  usePlaceDetail,
} from "@/features/discovery/hooks";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const DEFAULT_DURATION_MINUTES = 60;
const TIMELINE_SLOT_DURATION = 60;

const claimFormSchema = z.object({
  organizationId: S.ids.organizationId,
  requestNotes: S.claimRequest.requestNotesOptional,
});

const removalFormSchema = z.object({
  guestName: S.claimRequest.guestName,
  guestEmail: S.claimRequest.guestEmail,
  requestNotes: S.claimRequest.requestNotes,
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

type RemovalFormData = z.infer<typeof removalFormSchema>;

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeIdOrSlug = (params.placeId ?? params.id) as string;

  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const utils = trpc.useUtils();
  const { data: organizations = [] } = trpc.organization.my.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );
  const isOwner = organizations.length > 0;

  const claimForm = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: "onChange",
    defaultValues: {
      organizationId: organizations[0]?.id ?? "",
      requestNotes: "",
    },
  });

  const removalForm = useForm<RemovalFormData>({
    resolver: zodResolver(removalFormSchema),
    mode: "onChange",
    defaultValues: {
      guestName: "",
      guestEmail: "",
      requestNotes: "",
    },
  });

  const {
    setValue: setClaimValue,
    reset: resetClaimForm,
    getValues: getClaimValues,
    formState: { isValid: isClaimValid, isSubmitting: isClaimSubmitting },
  } = claimForm;

  const {
    reset: resetRemovalForm,
    formState: { isValid: isRemovalValid, isSubmitting: isRemovalSubmitting },
  } = removalForm;

  const [isClaimOpen, setIsClaimOpen] = React.useState(false);
  const [isRemovalOpen, setIsRemovalOpen] = React.useState(false);

  const availabilitySectionRef = React.useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null);

  const { data: place, isLoading } = usePlaceDetail({
    placeIdOrSlug,
  });
  const placeId = place?.id;
  const placeSlugOrId = place?.slug ?? place?.id ?? placeIdOrSlug;
  const analyticsPlaceId = place?.id ?? placeIdOrSlug;
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";
  const {
    isBookable,
    isCurated,
    showBooking,
    showVerificationBadge,
    showBookingVerificationUi,
    verificationMessage,
    verificationDescription,
    verificationStatusVariant,
  } = getPlaceVerificationDisplay({
    placeType: place?.placeType,
    verificationStatus: place?.verification?.status,
    reservationsEnabled: place?.verification?.reservationsEnabled,
  });
  const canSubmitClaim = Boolean(
    place &&
      isCurated &&
      place.claimStatus === "UNCLAIMED" &&
      isAuthenticated &&
      isOwner,
  );

  const {
    selectedDate,
    setSelectedDate,
    durationMinutes,
    setDurationMinutes,
    selectedSportId,
    setSelectedSportId,
    selectionMode,
    setSelectionMode,
    selectedCourtId,
    setSelectedCourtId,
    selectedStartTime,
    setSelectedStartTime,
    selectedSlotId: _selectedSlotId,
    setSelectedSlotId,
    courtViewMode,
    setCourtViewMode,
    anyViewMode,
    setAnyViewMode,
    courtsForSport,
    clearSelection,
  } = usePlaceAvailabilitySelection({
    place,
    isBookable,
    defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
  });

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
  const organizationOptions = React.useMemo(
    () =>
      organizations.map((organization) => ({
        label: organization.name,
        value: organization.id,
      })),
    [organizations],
  );
  const defaultOrganizationId = organizations[0]?.id ?? "";

  const claimMutation = trpc.claimRequest.submitClaim.useMutation();
  const removalMutation = trpc.claimRequest.submitGuestRemoval.useMutation();

  React.useEffect(() => {
    if (!defaultOrganizationId) return;
    const currentOrgId = getClaimValues("organizationId");
    if (currentOrgId) return;
    setClaimValue("organizationId", defaultOrganizationId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultOrganizationId, getClaimValues, setClaimValue]);

  React.useEffect(() => {
    if (isClaimOpen) return;
    const currentOrgId = getClaimValues("organizationId") ?? "";
    const currentNotes = getClaimValues("requestNotes") ?? "";
    if (currentOrgId === defaultOrganizationId && currentNotes === "") {
      return;
    }
    resetClaimForm({
      organizationId: defaultOrganizationId,
      requestNotes: "",
    });
  }, [defaultOrganizationId, getClaimValues, isClaimOpen, resetClaimForm]);

  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const maxBookingDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const maxDayKey = React.useMemo(
    () => getZonedDayKey(maxBookingDate, placeTimeZone),
    [maxBookingDate, placeTimeZone],
  );
  const todayRange = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone),
    [placeTimeZone, today],
  );

  const currentHour = React.useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: placeTimeZone,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? Number.parseInt(hourPart.value, 10) : 0;
  }, [placeTimeZone]);

  const currentTimeISO = React.useMemo(() => new Date().toISOString(), []);

  React.useEffect(() => {
    if (!showBooking) return;
    if (!selectedDate) {
      setSelectedDate(today);
      return;
    }
    const selectedRange = getZonedDayRangeForInstant(
      selectedDate,
      placeTimeZone,
    );
    if (selectedRange.start < todayRange.start) {
      setSelectedDate(today);
    }
  }, [
    placeTimeZone,
    selectedDate,
    setSelectedDate,
    showBooking,
    today,
    todayRange.start,
  ]);

  const selectedDayKey = React.useMemo(
    () => getZonedDayKey(selectedDate ?? today, placeTimeZone),
    [placeTimeZone, selectedDate, today],
  );

  const formattedDateLabel = React.useMemo(
    () =>
      selectedDate
        ? formatInTimeZone(selectedDate, placeTimeZone, "MMM d, yyyy")
        : "",
    [placeTimeZone, selectedDate],
  );

  const isCourtMode = selectionMode === "court";
  const isCourtWeekView = courtViewMode === "week";
  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(selectedDayKey, placeTimeZone),
    [placeTimeZone, selectedDayKey],
  );
  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, placeTimeZone),
    [placeTimeZone, weekStartDayKey],
  );
  const weekRangeStartIso = React.useMemo(() => {
    const weekStart = parseDayKeyToDate(
      weekDayKeys[0] ?? selectedDayKey,
      placeTimeZone,
    );
    const clamped = weekStart < todayRange.start ? todayRange.start : weekStart;
    return toUtcISOString(clamped);
  }, [placeTimeZone, selectedDayKey, todayRange.start, weekDayKeys]);
  const weekRangeEndIso = React.useMemo(() => {
    const weekEnd = getZonedDayRangeForInstant(
      parseDayKeyToDate(weekDayKeys[6] ?? selectedDayKey, placeTimeZone),
      placeTimeZone,
    ).end;
    const maxEnd = getZonedDayRangeForInstant(
      maxBookingDate,
      placeTimeZone,
    ).end;
    return toUtcISOString(weekEnd > maxEnd ? maxEnd : weekEnd);
  }, [maxBookingDate, placeTimeZone, selectedDayKey, weekDayKeys]);

  const courtDayDateIso = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return "";
    return getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone);
  }, [isCourtMode, isCourtWeekView, placeTimeZone, selectedDate, today]);

  const courtDayAvailabilityQuery = trpc.availability.getForCourt.useQuery(
    {
      courtId: selectedCourtId ?? "",
      date: courtDayDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    {
      enabled:
        showBooking &&
        isCourtMode &&
        !isCourtWeekView &&
        !!selectedCourtId &&
        !!courtDayDateIso,
    },
  );

  const courtWeekAvailabilityQuery =
    trpc.availability.getForCourtRange.useQuery(
      {
        courtId: selectedCourtId ?? "",
        startDate: weekRangeStartIso,
        endDate: weekRangeEndIso,
        durationMinutes: TIMELINE_SLOT_DURATION,
        includeUnavailable: true,
      },
      {
        enabled:
          showBooking && isCourtMode && isCourtWeekView && !!selectedCourtId,
      },
    );

  // "Any court" week/day query — uses 60-min slots like court mode
  const anyWeekDayDateIso = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "day") return "";
    return getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone);
  }, [anyViewMode, placeTimeZone, selectedDate, selectionMode, today]);

  const anyWeekAvailabilityQuery =
    trpc.availability.getForPlaceSportRange.useQuery(
      {
        placeId: place?.id ?? "",
        sportId: selectedSportId ?? "",
        startDate: weekRangeStartIso,
        endDate: weekRangeEndIso,
        durationMinutes: TIMELINE_SLOT_DURATION,
        includeUnavailable: true,
        includeCourtOptions: false,
      },
      {
        enabled:
          showBooking &&
          selectionMode === "any" &&
          anyViewMode === "week" &&
          !!place?.id &&
          !!selectedSportId,
      },
    );

  const anyDayAvailabilityQuery =
    trpc.availability.getForPlaceSportRange.useQuery(
      {
        placeId: place?.id ?? "",
        sportId: selectedSportId ?? "",
        startDate: anyWeekDayDateIso,
        endDate: anyWeekDayDateIso
          ? toUtcISOString(
              getZonedDayRangeForInstant(
                new Date(anyWeekDayDateIso),
                placeTimeZone,
              ).end,
            )
          : "",
        durationMinutes: TIMELINE_SLOT_DURATION,
        includeUnavailable: true,
        includeCourtOptions: false,
      },
      {
        enabled:
          showBooking &&
          selectionMode === "any" &&
          anyViewMode === "day" &&
          !!place?.id &&
          !!selectedSportId &&
          !!anyWeekDayDateIso,
      },
    );

  const anyWeekSlotsByDay = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "week")
      return new Map<string, TimeSlot[]>();
    return buildSlotsByDayKey(
      anyWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [
    anyViewMode,
    anyWeekAvailabilityQuery.data,
    placeTimeZone,
    selectionMode,
  ]);

  const anyDaySlots: TimeSlot[] = React.useMemo(() => {
    if (selectionMode !== "any" || anyViewMode !== "day") return [];
    const slots = mapAvailabilityOptionsToSlots(
      anyDayAvailabilityQuery.data?.options ?? [],
      TIMELINE_SLOT_DURATION,
    );
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [anyDayAvailabilityQuery.data, anyViewMode, selectionMode]);

  const courtDaySlots: TimeSlot[] = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return [];
    return mapAvailabilityOptionsToSlots(
      courtDayAvailabilityQuery.data?.options ?? [],
      TIMELINE_SLOT_DURATION,
    );
  }, [courtDayAvailabilityQuery.data, isCourtMode, isCourtWeekView]);

  const courtDayDiagnostics = React.useMemo(() => {
    if (!isCourtMode || isCourtWeekView) return null;
    return courtDayAvailabilityQuery.data?.diagnostics ?? null;
  }, [courtDayAvailabilityQuery.data, isCourtMode, isCourtWeekView]);

  const courtWeekSlotsByDay = React.useMemo(() => {
    if (!isCourtMode || !isCourtWeekView) return new Map<string, TimeSlot[]>();
    return buildSlotsByDayKey(
      courtWeekAvailabilityQuery.data?.options ?? [],
      placeTimeZone,
      TIMELINE_SLOT_DURATION,
    );
  }, [
    isCourtMode,
    isCourtWeekView,
    placeTimeZone,
    courtWeekAvailabilityQuery.data,
  ]);

  const activeAvailabilityError = React.useMemo(() => {
    if (selectionMode === "any") {
      const query =
        anyViewMode === "week"
          ? anyWeekAvailabilityQuery
          : anyDayAvailabilityQuery;
      return getAvailabilityErrorInfo(query.error, query.refetch);
    }
    const query = isCourtWeekView
      ? courtWeekAvailabilityQuery
      : courtDayAvailabilityQuery;
    return getAvailabilityErrorInfo(query.error, query.refetch);
  }, [
    anyDayAvailabilityQuery,
    anyViewMode,
    anyWeekAvailabilityQuery,
    courtDayAvailabilityQuery,
    courtWeekAvailabilityQuery,
    isCourtWeekView,
    selectionMode,
  ]);

  const hasSelection = !!selectedStartTime;

  const selectedRange = React.useMemo(
    () =>
      selectedStartTime
        ? { startTime: selectedStartTime, durationMinutes }
        : undefined,
    [durationMinutes, selectedStartTime],
  );

  const selectionSummary = React.useMemo(() => {
    if (!selectedStartTime) return null;
    const dayKey = getZonedDayKey(selectedStartTime, placeTimeZone);
    const slotsForDay =
      selectionMode === "any"
        ? anyViewMode === "week"
          ? (anyWeekSlotsByDay.get(dayKey) ?? [])
          : anyDaySlots
        : isCourtWeekView
          ? (courtWeekSlotsByDay.get(dayKey) ?? [])
          : courtDaySlots;
    const startIdx = slotsForDay.findIndex(
      (slot) => slot.startTime === selectedStartTime,
    );
    if (startIdx === -1) return null;
    const slotCount = durationMinutes / TIMELINE_SLOT_DURATION;
    let totalCents = 0;
    let allHavePrice = true;
    let endTime = slotsForDay[startIdx]?.endTime ?? "";
    for (
      let i = startIdx;
      i < startIdx + slotCount && i < slotsForDay.length;
      i++
    ) {
      if (slotsForDay[i].priceCents !== undefined) {
        totalCents += slotsForDay[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
      endTime = slotsForDay[i].endTime;
    }
    return {
      startTime: selectedStartTime,
      endTime,
      totalCents: allHavePrice ? totalCents : undefined,
      currency: slotsForDay[startIdx]?.currency ?? "PHP",
    };
  }, [
    anyDaySlots,
    anyViewMode,
    anyWeekSlotsByDay,
    courtDaySlots,
    courtWeekSlotsByDay,
    durationMinutes,
    isCourtWeekView,
    placeTimeZone,
    selectedStartTime,
    selectionMode,
  ]);

  React.useEffect(() => {
    if (!selectedStartTime) return;
    trackEvent({
      event: "funnel.schedule_slot_selected",
      properties: {
        placeId: analyticsPlaceId,
        mode: selectionMode,
        durationMinutes,
        startTime: selectedStartTime,
        courtId: selectionMode === "court" ? selectedCourtId : undefined,
      },
    });
  }, [
    analyticsPlaceId,
    durationMinutes,
    selectedCourtId,
    selectedStartTime,
    selectionMode,
  ]);

  const summaryCtaVariant = hasSelection ? "default" : "outline";
  const summaryCtaLabel = hasSelection ? "Continue to review" : "Select a time";
  const selectionDateLabel =
    hasSelection && selectedStartTime
      ? `${formatInTimeZone(
          new Date(selectedStartTime),
          placeTimeZone,
          "EEE, MMM d",
        )}`
      : formattedDateLabel || "Pick a date";
  const selectionTimeLabel =
    hasSelection && selectedStartTime
      ? `${formatInTimeZone(
          new Date(selectedStartTime),
          placeTimeZone,
          "h:mm a",
        )}${
          selectionSummary?.endTime
            ? `-${formatInTimeZone(
                new Date(selectionSummary.endTime),
                placeTimeZone,
                "h:mm a",
              )}`
            : ""
        }`
      : "";

  const isLoadingAvailability =
    selectionMode === "any"
      ? anyViewMode === "week"
        ? anyWeekAvailabilityQuery.isLoading
        : anyDayAvailabilityQuery.isLoading
      : isCourtWeekView
        ? courtWeekAvailabilityQuery.isLoading
        : courtDayAvailabilityQuery.isLoading;

  const handleCourtRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      setSelectedStartTime(range.startTime);
      setSelectedSlotId(undefined);
      setDurationMinutes(range.durationMinutes);
    },
    [setDurationMinutes, setSelectedSlotId, setSelectedStartTime],
  );

  const handleAnyRangeChange = React.useCallback(
    (range: { startTime: string; durationMinutes: number }) => {
      if (!range.startTime) {
        setSelectedStartTime(undefined);
        setSelectedSlotId(undefined);
        return;
      }
      setSelectedStartTime(range.startTime);
      setSelectedSlotId(undefined);
      setDurationMinutes(range.durationMinutes);
    },
    [setDurationMinutes, setSelectedSlotId, setSelectedStartTime],
  );

  const handleCourtViewChange = React.useCallback(
    (value: string) => {
      if (!value) return;
      setCourtViewMode(value as "week" | "day");
      clearSelection(true);
    },
    [clearSelection, setCourtViewMode],
  );

  const handleGoToToday = React.useCallback(() => {
    setSelectedDate(today);
    clearSelection(true);
  }, [clearSelection, setSelectedDate, today]);

  const [calendarPopoverOpen, setCalendarPopoverOpen] = React.useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = React.useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = React.useState(false);
  const handleCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
      setCalendarPopoverOpen(false);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleMobileCalendarJump = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
      setMobileCalendarOpen(false);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleMobileDateSelect = React.useCallback(
    (date: Date) => {
      const nextDayKey = getZonedDayKey(date, placeTimeZone);
      setSelectedDate(parseDayKeyToDate(nextDayKey, placeTimeZone));
      clearSelection(true);
    },
    [clearSelection, placeTimeZone, setSelectedDate],
  );

  const handleMobileSportChange = React.useCallback(
    (sportId: string) => {
      setSelectedSportId(sportId);
      setSelectionMode("any");
      setSelectedCourtId(undefined);
      clearSelection(true);
    },
    [clearSelection, setSelectedCourtId, setSelectedSportId, setSelectionMode],
  );

  const handleMobileCourtChange = React.useCallback(
    (courtId: string | undefined) => {
      if (courtId) {
        setSelectionMode("court");
        setSelectedCourtId(courtId);
      } else {
        setSelectionMode("any");
        setSelectedCourtId(undefined);
      }
      clearSelection(true);
    },
    [clearSelection, setSelectedCourtId, setSelectionMode],
  );

  // Mobile day slots — always uses day view for "any court" or specific court
  const mobileDayDateIso = React.useMemo(() => {
    return getZonedStartOfDayIso(selectedDate ?? today, placeTimeZone);
  }, [placeTimeZone, selectedDate, today]);

  const mobileAnyDayQuery = trpc.availability.getForPlaceSportRange.useQuery(
    {
      placeId: place?.id ?? "",
      sportId: selectedSportId ?? "",
      startDate: mobileDayDateIso,
      endDate: mobileDayDateIso
        ? toUtcISOString(
            getZonedDayRangeForInstant(
              new Date(mobileDayDateIso),
              placeTimeZone,
            ).end,
          )
        : "",
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
      includeCourtOptions: false,
    },
    {
      enabled:
        showBooking &&
        selectionMode === "any" &&
        !!place?.id &&
        !!selectedSportId &&
        !!mobileDayDateIso,
    },
  );

  const mobileCourtDayQuery = trpc.availability.getForCourt.useQuery(
    {
      courtId: selectedCourtId ?? "",
      date: mobileDayDateIso,
      durationMinutes: TIMELINE_SLOT_DURATION,
      includeUnavailable: true,
    },
    {
      enabled:
        showBooking &&
        selectionMode === "court" &&
        !!selectedCourtId &&
        !!mobileDayDateIso,
    },
  );

  const mobileDaySlots: TimeSlot[] = React.useMemo(() => {
    const options =
      selectionMode === "any"
        ? (mobileAnyDayQuery.data?.options ?? [])
        : (mobileCourtDayQuery.data?.options ?? []);
    const slots = mapAvailabilityOptionsToSlots(
      options,
      TIMELINE_SLOT_DURATION,
    );
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectionMode, mobileAnyDayQuery.data, mobileCourtDayQuery.data]);

  const isMobileLoading =
    selectionMode === "any"
      ? mobileAnyDayQuery.isLoading
      : mobileCourtDayQuery.isLoading;

  const handleJumpToMaxDate = React.useCallback(() => {
    setSelectedDate(maxBookingDate);
    clearSelection(true);
  }, [clearSelection, maxBookingDate, setSelectedDate]);

  const isAnyWeekView = selectionMode === "any" && anyViewMode === "week";
  const weekHeaderLabel = React.useMemo(() => {
    if (!isCourtWeekView && !isAnyWeekView) return "";
    const start = parseDayKeyToDate(
      weekDayKeys[0] ?? selectedDayKey,
      placeTimeZone,
    );
    const end = parseDayKeyToDate(
      weekDayKeys[6] ?? selectedDayKey,
      placeTimeZone,
    );
    const startLabel = formatInTimeZone(start, placeTimeZone, "MMM d");
    const endLabel = formatInTimeZone(end, placeTimeZone, "MMM d, yyyy");
    return `${startLabel} - ${endLabel}`;
  }, [
    isAnyWeekView,
    isCourtWeekView,
    placeTimeZone,
    selectedDayKey,
    weekDayKeys,
  ]);

  const handleClaimSubmit = async (data: ClaimFormData) => {
    if (!placeId) return;
    try {
      await claimMutation.mutateAsync({
        placeId,
        organizationId: data.organizationId,
        requestNotes: data.requestNotes?.trim() || undefined,
      });
      toast.success("Claim submitted", {
        description: "We will review your request within 48 hours.",
      });
      resetClaimForm({
        organizationId: defaultOrganizationId,
        requestNotes: "",
      });
      setIsClaimOpen(false);
      await utils.place.getByIdOrSlug.invalidate({ placeIdOrSlug });
    } catch (error) {
      toast.error("Unable to submit claim", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemovalSubmit = async (data: RemovalFormData) => {
    if (!placeId) return;
    try {
      await removalMutation.mutateAsync({
        placeId,
        guestName: data.guestName.trim(),
        guestEmail: data.guestEmail.trim(),
        requestNotes: data.requestNotes.trim(),
      });
      toast.success("Removal request submitted", {
        description: "We will review your request shortly.",
      });
      resetRemovalForm({
        guestName: "",
        guestEmail: "",
        requestNotes: "",
      });
      setIsRemovalOpen(false);
      await utils.place.getByIdOrSlug.invalidate({ placeIdOrSlug });
    } catch (error) {
      toast.error("Unable to submit removal request", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const claimSubmitting = claimMutation.isPending || isClaimSubmitting;
  const claimDisabled = claimSubmitting || !isClaimValid;
  const removalSubmitting = removalMutation.isPending || isRemovalSubmitting;
  const removalDisabled = removalSubmitting || !isRemovalValid;

  const handleReserve = () => {
    if (!place || !selectedStartTime) return;
    const params = new URLSearchParams();

    params.set("duration", String(durationMinutes));
    params.set("mode", selectionMode);

    if (selectedSportId) {
      params.set("sportId", selectedSportId);
    }

    if (selectedDate) {
      params.set("date", getZonedDayKey(selectedDate, placeTimeZone));
    }

    if (selectionMode === "court" && selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }

    params.set("startTime", selectedStartTime);

    const destination = `${appRoutes.places.book(placeSlugOrId)}?${params.toString()}`;

    trackEvent({
      event: "funnel.reserve_clicked",
      properties: {
        placeId: analyticsPlaceId,
        mode: selectionMode,
        durationMinutes,
        startTime: selectedStartTime,
        courtId: selectionMode === "court" ? selectedCourtId : undefined,
      },
    });

    if (isAuthenticated) {
      router.push(destination);
    } else {
      const returnTo = appRoutes.places.detail(placeSlugOrId);
      trackEvent({
        event: "funnel.login_started",
        properties: {
          placeId: analyticsPlaceId,
          redirect: returnTo,
        },
      });
      router.push(appRoutes.login.from(returnTo));
    }
  };

  const handleSummaryAction = () => {
    if (hasSelection) {
      handleReserve();
      return;
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheetExpanded(true);
    } else {
      scrollToSection(availabilitySectionRef);
    }
  };

  const handleScrollToAvailability = (event?: React.MouseEvent) => {
    if (!isBookable) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheetExpanded(true);
    } else {
      scrollToSection(availabilitySectionRef);
    }
  };

  if (isLoading) {
    return <PlaceDetailSkeleton />;
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue not found</h1>
          <p className="text-muted-foreground mt-2">
            The venue you&apos;re looking for doesn&apos;t exist or has been
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

  const hasCoordinates =
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude);
  const placeIdParam = place.extGPlaceId?.trim() ?? "";
  const contactDetail = place.contactDetail;
  const phoneNumber = contactDetail?.phoneNumber?.trim();
  const viberNumber = contactDetail?.viberInfo?.trim();
  const dialablePhone = phoneNumber ? toDialablePhone(phoneNumber) : "";
  const callHref = dialablePhone
    ? `tel:${dialablePhone}`
    : phoneNumber
      ? `tel:${phoneNumber}`
      : "";
  const hasCallCta = Boolean(callHref);
  const viberLink = viberNumber ? buildViberDeepLink(viberNumber) : "";
  const hasContactDetail = Boolean(
    contactDetail?.phoneNumber ||
      contactDetail?.websiteUrl ||
      contactDetail?.facebookUrl ||
      contactDetail?.instagramUrl ||
      contactDetail?.viberInfo ||
      contactDetail?.otherContactInfo,
  );
  const claimStatusMessage =
    place.claimStatus === "CLAIM_PENDING"
      ? "A claim request is pending admin review."
      : place.claimStatus === "CLAIMED"
        ? "This venue has already been claimed."
        : place.claimStatus === "REMOVAL_REQUESTED"
          ? "This venue is pending removal review."
          : null;
  const claimHelperText = !isAuthenticated
    ? "Sign in to claim this venue."
    : !isOwner
      ? "Create an organization to claim this venue."
      : "This venue is not currently available to claim.";
  const removalHelperText =
    place.claimStatus === "REMOVAL_REQUESTED"
      ? "A removal request is already pending review."
      : "Flag incorrect info or request removal.";
  const mapQuery = `${place.name} ${place.address} ${place.city}`;
  const destinationParam = hasCoordinates
    ? `&destination=${place.latitude},${place.longitude}`
    : "";
  const directionsUrl = placeIdParam
    ? `https://www.google.com/maps/dir/?api=1${destinationParam}&destination_place_id=${encodeURIComponent(placeIdParam)}`
    : hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const openInMapsQuery = hasCoordinates
    ? `${place.latitude},${place.longitude}`
    : mapQuery;
  const openInMapsUrl = placeIdParam
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}&query_place_id=${encodeURIComponent(placeIdParam)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(openInMapsQuery)}`;
  const logoUrl = place.logoUrl?.trim();
  const logoFallback = place.name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Container className="pt-4 sm:pt-6">
      {/* Venue header */}
      <div className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50 p-1">
            {logoUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={logoUrl}
                  alt={`${place.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <span className="font-heading text-xs font-semibold text-foreground">
                {logoFallback}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="font-heading text-xl font-semibold text-foreground leading-tight sm:text-2xl">
                {place.name}
              </h1>
              {showVerificationBadge && (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {isCurated && (
                <Badge variant="secondary" className="text-[10px]">
                  Curated
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {place.city}
              {place.address ? ` · ${place.address}` : ""}
            </p>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2">
          {showBooking && (
            <Button
              type="button"
              size="sm"
              onClick={handleScrollToAvailability}
            >
              <Calendar className="h-4 w-4" />
              Check availability
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4" />
              Directions
            </a>
          </Button>
          {hasCallCta && (
            <Button asChild variant="outline" size="sm">
              <a href={callHref}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-only carousel */}
      <div className="mt-4 lg:hidden">
        <PhotoCarousel photos={place.photos} courtName={place.name} />
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3 mt-4 lg:mt-6 pb-[70vh] lg:pb-24">
        <div className="lg:col-span-2 space-y-6">
          {showBooking && (
            <div
              ref={availabilitySectionRef}
              className="scroll-mt-24 hidden lg:block"
            >
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>Availability</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Browse times across courts, or pick a specific court to
                        select a range.
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-accent/10 text-accent"
                    >
                      Live availability
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sport</p>
                    <Tabs
                      value={selectedSportId}
                      onValueChange={(value) => {
                        setSelectedSportId(value);
                        setSelectionMode("any");
                        setSelectedCourtId(undefined);
                        setCourtViewMode("week");
                        clearSelection();
                      }}
                    >
                      <TabsList>
                        {place.sports.map((sport) => (
                          <TabsTrigger key={sport.id} value={sport.id}>
                            {sport.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">View</p>
                      <ToggleGroup
                        type="single"
                        value={selectionMode}
                        onValueChange={(value) => {
                          if (!value) return;
                          setSelectionMode(value as "any" | "court");
                          if (value === "court") {
                            clearSelection(true);
                            setCourtViewMode("week");
                          } else {
                            clearSelection();
                          }
                        }}
                      >
                        <ToggleGroupItem value="court" size="sm">
                          Pick a court
                        </ToggleGroupItem>
                        <ToggleGroupItem value="any" size="sm">
                          Any court
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {selectionMode !== "court" ? null : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Court</p>
                        {courtsForSport.length > 0 ? (
                          <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
                            <div className="flex gap-1.5">
                              {courtsForSport.map((court) => (
                                <button
                                  key={court.id}
                                  type="button"
                                  onClick={() => {
                                    if (selectedCourtId !== court.id) {
                                      setSelectedCourtId(court.id);
                                      clearSelection(true);
                                    }
                                  }}
                                  className={cn(
                                    "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                                    selectedCourtId === court.id
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-foreground hover:bg-accent/10 hover:border-accent/30",
                                  )}
                                >
                                  {court.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No active courts for this sport.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {selectionMode === "any" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Schedule view</p>
                          <p className="text-xs text-muted-foreground">
                            Click a start time, then click an end time to select
                            a range.
                          </p>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={anyViewMode}
                          onValueChange={(value) => {
                            if (!value) return;
                            setAnyViewMode(value as "week" | "day");
                            clearSelection(true);
                          }}
                        >
                          <ToggleGroupItem value="week" size="sm">
                            Week
                          </ToggleGroupItem>
                          <ToggleGroupItem value="day" size="sm">
                            Day
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {anyViewMode === "week" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Popover
                            open={calendarPopoverOpen}
                            onOpenChange={setCalendarPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Open calendar to jump to a date"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                {weekHeaderLabel}
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 opacity-50 transition-transform duration-200",
                                    calendarPopoverOpen && "rotate-180",
                                  )}
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <CalendarWidget
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleCalendarJump}
                                disabled={(date) => {
                                  if (date < todayRange.start) return true;
                                  if (date > maxBookingDate) return true;
                                  return false;
                                }}
                                timeZone={placeTimeZone}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGoToToday}
                          >
                            Today
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <KudosDatePicker
                            value={selectedDate}
                            onChange={handleCalendarJump}
                            placeholder="Choose a date"
                            maxDate={maxBookingDate}
                            timeZone={placeTimeZone}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGoToToday}
                          >
                            Today
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectionMode === "court" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Schedule view</p>
                          <p className="text-xs text-muted-foreground">
                            Click a start time, then click an end time to select
                            a range.
                          </p>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={courtViewMode}
                          onValueChange={handleCourtViewChange}
                        >
                          <ToggleGroupItem value="week" size="sm">
                            Week
                          </ToggleGroupItem>
                          <ToggleGroupItem value="day" size="sm">
                            Day
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {isCourtWeekView ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Popover
                            open={calendarPopoverOpen}
                            onOpenChange={setCalendarPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Open calendar to jump to a date"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                {weekHeaderLabel}
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 opacity-50 transition-transform duration-200",
                                    calendarPopoverOpen && "rotate-180",
                                  )}
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <CalendarWidget
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleCalendarJump}
                                disabled={(date) => {
                                  if (date < todayRange.start) return true;
                                  if (date > maxBookingDate) return true;
                                  return false;
                                }}
                                timeZone={placeTimeZone}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGoToToday}
                          >
                            Today
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <KudosDatePicker
                            value={selectedDate}
                            onChange={handleCalendarJump}
                            placeholder="Choose a date"
                            maxDate={maxBookingDate}
                            timeZone={placeTimeZone}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGoToToday}
                          >
                            Today
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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
                              Bookings are available up to{" "}
                              {MAX_BOOKING_WINDOW_DAYS} days in advance.
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
                              Something went wrong while loading availability.
                              Please try again.
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

                  {selectionMode === "any" ? (
                    anyViewMode === "week" ? (
                      isLoadingAvailability ? (
                        <AvailabilityWeekGridSkeleton
                          dayKeys={weekDayKeys}
                          timeZone={placeTimeZone}
                        />
                      ) : (
                        <AvailabilityWeekGrid
                          dayKeys={weekDayKeys}
                          slotsByDay={anyWeekSlotsByDay}
                          timeZone={placeTimeZone}
                          selectedRange={selectedRange}
                          onRangeChange={handleAnyRangeChange}
                          onDayClick={(dayKey) => {
                            setSelectedDate(
                              parseDayKeyToDate(dayKey, placeTimeZone),
                            );
                            setAnyViewMode("day");
                            clearSelection(true);
                          }}
                          onContinue={handleReserve}
                          todayDayKey={todayDayKey}
                          maxDayKey={maxDayKey}
                          currentHour={currentHour}
                        />
                      )
                    ) : !selectedDate ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        Select a date to see available start times.
                      </p>
                    ) : isLoadingAvailability ? (
                      <TimeRangePickerSkeleton count={8} />
                    ) : anyDaySlots.length > 0 ? (
                      <TimeRangePicker
                        slots={anyDaySlots}
                        timeZone={placeTimeZone}
                        selectedStartTime={selectedRange?.startTime}
                        selectedDurationMinutes={selectedRange?.durationMinutes}
                        showPrice
                        onChange={handleAnyRangeChange}
                        onClear={() => clearSelection(true)}
                        onContinue={handleReserve}
                        currentTimeISO={currentTimeISO}
                      />
                    ) : (
                      <AvailabilityEmptyState
                        diagnostics={
                          anyDayAvailabilityQuery.data?.diagnostics ?? null
                        }
                        variant="public"
                        contact={contactDetail}
                      />
                    )
                  ) : !courtsForSport.length ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No active courts for this sport.
                    </p>
                  ) : !selectedCourtId ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Select a court to see available times.
                    </p>
                  ) : isCourtWeekView ? (
                    isLoadingAvailability ? (
                      <AvailabilityWeekGridSkeleton
                        dayKeys={weekDayKeys}
                        timeZone={placeTimeZone}
                      />
                    ) : (
                      <AvailabilityWeekGrid
                        dayKeys={weekDayKeys}
                        slotsByDay={courtWeekSlotsByDay}
                        timeZone={placeTimeZone}
                        selectedRange={selectedRange}
                        onRangeChange={handleCourtRangeChange}
                        onDayClick={(dayKey) => {
                          setSelectedDate(
                            parseDayKeyToDate(dayKey, placeTimeZone),
                          );
                          setCourtViewMode("day");
                          clearSelection(true);
                        }}
                        onContinue={handleReserve}
                        todayDayKey={todayDayKey}
                        maxDayKey={maxDayKey}
                      />
                    )
                  ) : !selectedDate ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Select a date to see available start times.
                    </p>
                  ) : isLoadingAvailability ? (
                    <TimeRangePickerSkeleton count={8} />
                  ) : courtDaySlots.length > 0 ? (
                    <TimeRangePicker
                      slots={courtDaySlots}
                      timeZone={placeTimeZone}
                      selectedStartTime={selectedRange?.startTime}
                      selectedDurationMinutes={selectedRange?.durationMinutes}
                      showPrice
                      onChange={handleCourtRangeChange}
                      onClear={() => clearSelection(true)}
                      onContinue={handleReserve}
                      currentTimeISO={currentTimeISO}
                    />
                  ) : (
                    <AvailabilityEmptyState
                      diagnostics={courtDayDiagnostics}
                      variant="public"
                      contact={contactDetail}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!hasContactDetail && (
                <p className="text-muted-foreground">
                  Contact details are not available yet.
                </p>
              )}
              {phoneNumber && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Phone</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${dialablePhone || phoneNumber}`}>
                        <Phone className="h-4 w-4" />
                        {phoneNumber}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copy phone number"
                      onClick={() =>
                        copyToClipboard(phoneNumber, "Phone number")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {contactDetail?.websiteUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Website</span>
                  <a
                    href={contactDetail.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    Visit
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {contactDetail?.facebookUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Facebook</span>
                  <a
                    href={contactDetail.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {contactDetail?.instagramUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Instagram</span>
                  <a
                    href={contactDetail.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {viberNumber && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Viber</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={viberLink || `viber://chat?number=${viberNumber}`}
                      >
                        <Phone className="h-4 w-4" />
                        {viberNumber}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copy Viber number"
                      onClick={() =>
                        copyToClipboard(viberNumber, "Viber number")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {contactDetail?.otherContactInfo && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Other</span>
                  <p className="text-sm">{contactDetail.otherContactInfo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {!showBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Courts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showBookingVerificationUi && (
                  <VerificationStatusBanner
                    message={verificationMessage}
                    description={verificationDescription}
                    variant={verificationStatusVariant}
                  />
                )}
                {place.courts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Court inventory has not been added yet.
                  </p>
                ) : (
                  place.courts.map((court) => (
                    <div
                      key={court.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{court.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {court.sportName}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {court.sportName}
                        </Badge>
                        {court.tierLabel && (
                          <Badge variant="secondary" className="text-[10px]">
                            {court.tierLabel}
                          </Badge>
                        )}
                        {!court.isActive && (
                          <Badge variant="destructive" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Desktop-only carousel */}
          <div className="hidden lg:block">
            <Card className="overflow-hidden p-0">
              <PhotoCarousel photos={place.photos} courtName={place.name} />
            </Card>
          </div>

          {showBooking ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Booking summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Court</p>
                    <p className="font-medium">
                      {selectionMode === "any"
                        ? "Any available court"
                        : (courtsForSport.find(
                            (court) => court.id === selectedCourtId,
                          )?.label ?? "Select a court")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formatDuration(durationMinutes)}
                    </p>
                  </div>
                  {hasSelection && selectionSummary ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Selected time
                      </p>
                      <p className="font-medium">
                        {formatInTimeZone(
                          new Date(selectionSummary.startTime),
                          placeTimeZone,
                          "MMM d, h:mm a",
                        )}{" "}
                        {selectionSummary.endTime
                          ? `- ${formatInTimeZone(
                              new Date(selectionSummary.endTime),
                              placeTimeZone,
                              "h:mm a",
                            )}`
                          : ""}
                        {selectionSummary.totalCents !== undefined
                          ? ` · ${formatCurrency(
                              selectionSummary.totalCents,
                              selectionSummary.currency,
                            )}`
                          : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Select a time to see pricing and continue.
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    variant={summaryCtaVariant}
                    onClick={handleSummaryAction}
                  >
                    {summaryCtaLabel}
                  </Button>

                  {!isAuthenticated && hasSelection && (
                    <p className="text-xs text-muted-foreground text-center">
                      Sign in to complete your booking request.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoogleMapsEmbed
                    title={`${place.name} location`}
                    lat={place.latitude}
                    lng={place.longitude}
                    placeId={place.extGPlaceId}
                    query={mapQuery}
                    className="aspect-[16/9] w-full"
                    allowInteraction={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={openInMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What happens next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    <span>
                      We&apos;ll hold the requested slots while you review.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>Owners review and confirm paid reservations.</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {showBookingVerificationUi && (
                <Card>
                  <CardHeader>
                    <CardTitle>Booking status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VerificationStatusBanner
                      message={verificationMessage}
                      description={verificationDescription}
                      variant={verificationStatusVariant}
                    />
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoogleMapsEmbed
                    title={`${place.name} location`}
                    lat={place.latitude}
                    lng={place.longitude}
                    placeId={place.extGPlaceId}
                    query={mapQuery}
                    className="aspect-[16/9] w-full"
                    allowInteraction={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={openInMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="rounded-xl border border-dashed border-border/60 bg-transparent p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <CircleHelp className="h-4 w-4" />
                    <span>Listing help</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    For owners
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Claim this listing
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Manage courts and enable bookings.
                          </p>
                        </div>
                      </div>

                      {canSubmitClaim && !claimStatusMessage && (
                        <Dialog
                          open={isClaimOpen}
                          onOpenChange={setIsClaimOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs hover:translate-y-0"
                            >
                              Start claim
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                              <DialogTitle>Submit claim request</DialogTitle>
                              <DialogDescription>
                                Share your organization and any context for the
                                admin review.
                              </DialogDescription>
                            </DialogHeader>
                            <StandardFormProvider
                              form={claimForm}
                              onSubmit={handleClaimSubmit}
                              className="space-y-4"
                            >
                              <StandardFormSelect<ClaimFormData>
                                name="organizationId"
                                label="Organization"
                                placeholder="Select organization"
                                options={organizationOptions}
                                required
                                disabled={organizationOptions.length === 1}
                              />
                              <StandardFormTextarea<ClaimFormData>
                                name="requestNotes"
                                label="Notes (optional)"
                                placeholder="Share any context that helps verify ownership."
                              />
                              <DialogFooter className="gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsClaimOpen(false)}
                                  disabled={claimSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={claimDisabled}>
                                  {claimSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Submit claim
                                </Button>
                              </DialogFooter>
                            </StandardFormProvider>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {claimStatusMessage ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {claimStatusMessage}
                      </p>
                    ) : !canSubmitClaim ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {claimHelperText}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Flag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Report an issue
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {removalHelperText}
                          </p>
                        </div>
                      </div>

                      {place.claimStatus !== "REMOVAL_REQUESTED" && (
                        <Dialog
                          open={isRemovalOpen}
                          onOpenChange={setIsRemovalOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs hover:translate-y-0"
                            >
                              Send report
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                              <DialogTitle>Request listing removal</DialogTitle>
                              <DialogDescription>
                                Share your contact details so we can follow up
                                during review.
                              </DialogDescription>
                            </DialogHeader>
                            <StandardFormProvider
                              form={removalForm}
                              onSubmit={handleRemovalSubmit}
                              className="space-y-4"
                            >
                              <StandardFormInput<RemovalFormData>
                                name="guestName"
                                label="Full name"
                                placeholder="Your name"
                                required
                              />
                              <StandardFormInput<RemovalFormData>
                                name="guestEmail"
                                label="Email"
                                placeholder="you@example.com"
                                required
                              />
                              <StandardFormTextarea<RemovalFormData>
                                name="requestNotes"
                                label="Reason"
                                placeholder="Let us know why this listing should be removed."
                                required
                              />
                              <DialogFooter className="gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsRemovalOpen(false)}
                                  disabled={removalSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={removalDisabled}
                                >
                                  {removalSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Submit request
                                </Button>
                              </DialogFooter>
                            </StandardFormProvider>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {place.claimStatus === "REMOVAL_REQUESTED" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Removal request submitted. We will review shortly.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {showBooking && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:hidden flex flex-col max-h-[85vh]">
          {/* Handle — tap to toggle */}
          <button
            type="button"
            className="flex flex-col items-center pt-3 pb-2 w-full"
            onClick={() => setMobileSheetExpanded((v) => !v)}
          >
            <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
            <div className="flex items-center gap-1.5 mt-1.5">
              <p className="text-base font-semibold">Check Availability</p>
              {mobileSheetExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {mobileSheetExpanded && (
            <>
              {/* Sport pills */}
              {place.sports.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-none">
                  {place.sports.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => handleMobileSportChange(sport.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        selectedSportId === sport.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted/50",
                      )}
                    >
                      {sport.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Court selector */}
              <div className="px-5 pb-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => handleMobileCourtChange(undefined)}
                    className={cn(
                      "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                      selectionMode === "any"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent/10 hover:border-accent/30",
                    )}
                  >
                    Any court
                  </button>
                  {courtsForSport.map((court) => (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => handleMobileCourtChange(court.id)}
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                        selectionMode === "court" &&
                          selectedCourtId === court.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-accent/10 hover:border-accent/30",
                      )}
                    >
                      {court.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date selector */}
              <div className="space-y-2 px-5 pb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setMobileCalendarOpen(true)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedDate
                    ? formatInTimeZone(
                        selectedDate,
                        placeTimeZone,
                        "EEEE, MMM d",
                      )
                    : "Pick a date"}
                </Button>
                <MobileDateStrip
                  selectedDate={selectedDate ?? today}
                  onDateSelect={handleMobileDateSelect}
                  timeZone={placeTimeZone}
                  todayDate={today}
                />
              </div>

              {/* Calendar dialog */}
              <Dialog
                open={mobileCalendarOpen}
                onOpenChange={setMobileCalendarOpen}
              >
                <DialogContent className="sm:max-w-fit p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Select a date</DialogTitle>
                    <DialogDescription>
                      Choose a date to view availability
                    </DialogDescription>
                  </DialogHeader>
                  <CalendarWidget
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleMobileCalendarJump}
                    disabled={(date) => {
                      if (date < todayRange.start) return true;
                      if (date > maxBookingDate) return true;
                      return false;
                    }}
                    timeZone={placeTimeZone}
                    initialFocus
                  />
                </DialogContent>
              </Dialog>

              {/* Time slots */}
              <MobileScrollThumb scrollRef={mobileScrollRef} />
              <div
                ref={mobileScrollRef}
                className="flex-1 overflow-y-auto px-5 pb-2 min-h-0"
              >
                {isMobileLoading ? (
                  <TimeRangePickerSkeleton count={5} />
                ) : mobileDaySlots.length > 0 ? (
                  <TimeRangePicker
                    slots={mobileDaySlots}
                    timeZone={placeTimeZone}
                    selectedStartTime={selectedRange?.startTime}
                    selectedDurationMinutes={selectedRange?.durationMinutes}
                    showPrice
                    onChange={
                      selectionMode === "any"
                        ? handleAnyRangeChange
                        : handleCourtRangeChange
                    }
                    onClear={() => clearSelection(true)}
                    onContinue={handleReserve}
                    currentTimeISO={currentTimeISO}
                  />
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No available slots for this date.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Booking footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background">
            <div className="min-w-0">
              {hasSelection && selectionSummary ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {selectionDateLabel}
                    {selectionTimeLabel ? ` · ${selectionTimeLabel}` : ""}
                  </p>
                  {selectionSummary.totalCents !== undefined && (
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(
                        selectionSummary.totalCents,
                        selectionSummary.currency,
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a time slot
                </p>
              )}
            </div>
            <Button disabled={!hasSelection} onClick={handleReserve}>
              Reserve
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}

function PlaceDetailSkeleton() {
  return (
    <Container className="pt-4 sm:pt-6">
      <div className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-36 bg-muted rounded-md animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
        </div>
      </div>
      <div className="mt-4 lg:hidden">
        <div className="aspect-[16/10] bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3 mt-4 lg:mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-muted rounded-xl animate-pulse hidden lg:block" />
        </div>
        <div className="space-y-4">
          <div className="hidden lg:block aspect-[16/10] bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse hidden lg:block" />
        </div>
      </div>
      {/* Mobile bottom sheet skeleton */}
      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:hidden p-5 space-y-3">
        <div className="flex justify-center pb-1">
          <div className="w-9 h-1 bg-muted rounded-full" />
        </div>
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-full animate-pulse" />
          <div className="h-9 w-20 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`day-skel-${String(i)}`}
              className="h-14 w-12 bg-muted rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
