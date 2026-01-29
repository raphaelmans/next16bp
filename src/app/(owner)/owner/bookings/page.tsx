"use client";

import { TZDate } from "@date-fns/tz";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
// DnD kept only for draft-row import overlay
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  addMinutes,
  addMonths,
  differenceInMinutes,
  endOfMonth,
} from "date-fns";
import debounce from "debounce";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLogout, useSession } from "@/features/auth";
import { MobileDateStrip } from "@/features/discovery/components/mobile-date-strip";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner";
import {
  BookingStudioProvider,
  useBookingStudio,
} from "@/features/owner/components/booking-studio/booking-studio-provider";
import { CustomBlockDialog } from "@/features/owner/components/booking-studio/custom-block-dialog";
import {
  DraftRowCard,
  DraftTimelineBlock,
} from "@/features/owner/components/booking-studio/draft-row-card";
import { GuestBookingDialog } from "@/features/owner/components/booking-studio/guest-booking-dialog";
import { MobileCreateBlockDrawer } from "@/features/owner/components/booking-studio/mobile-create-block-drawer";
import { MobileDayBlocksList } from "@/features/owner/components/booking-studio/mobile-day-blocks-list";
import { RemoveBlockDialog } from "@/features/owner/components/booking-studio/remove-block-dialog";
import { SelectableTimelineRow } from "@/features/owner/components/booking-studio/selectable-timeline-row";
import { SelectionPanelForm } from "@/features/owner/components/booking-studio/selection-panel-form";
import { TimelineBlockItem } from "@/features/owner/components/booking-studio/timeline-block-item";
import { TimelineReservationItem } from "@/features/owner/components/booking-studio/timeline-reservation-item";
import {
  buildDateFromDayKey,
  type CourtBlockItem,
  type CustomBlockFormValues,
  customBlockSchema,
  DRAFT_STATUS_PRIORITY,
  type DraftRowItem,
  type DraftRowStatus,
  type DragItem,
  formatDateTimeInput,
  type GuestBookingFormValues,
  generateOptimisticId,
  getEndMinuteForDayKey,
  getMinuteOfDay,
  guestBookingFormSchema,
  parseDateTimeInput,
  parseTimelineRange,
  type ReservationItem,
  type StudioView,
  studioViewSchema,
  TIMELINE_ROW_HEIGHT,
  type TimelineCellData,
} from "@/features/owner/components/booking-studio/types";
import { WeekDayColumn } from "@/features/owner/components/booking-studio/week-day-column";
import {
  useCourtHours,
  useOwnerCourtFilter,
  useOwnerCourtsByPlace,
  useOwnerOrganization,
  useOwnerPlaceFilter,
  useOwnerPlaces,
} from "@/features/owner/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  type RangeSelectionConfig,
  RangeSelectionProvider,
} from "@/shared/components/kudos/range-selection";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/shared/lib/format";
import {
  getZonedDate,
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  getZonedToday,
  toUtcISOString,
} from "@/shared/lib/time-zone";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

export default function OwnerAvailabilityStudioPage() {
  return (
    <BookingStudioProvider initialDate={new Date()}>
      <OwnerAvailabilityStudioInner />
    </BookingStudioProvider>
  );
}

function OwnerAvailabilityStudioInner() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { placeId, setPlaceId } = useOwnerPlaceFilter({
    storageKey: "owner.availabilityStudio.placeId",
  });
  const { courtId, setCourtId } = useOwnerCourtFilter({
    storageKey: "owner.availabilityStudio.courtId",
  });

  const { data: places = [], isLoading: placesLoading } = useOwnerPlaces(
    organization?.id ?? null,
  );
  const { data: courts = [], isLoading: courtsLoading } =
    useOwnerCourtsByPlace(placeId);

  const selectedPlace = React.useMemo(
    () => places.find((place) => place.id === placeId),
    [placeId, places],
  );
  const placeTimeZone = selectedPlace?.timeZone ?? "Asia/Manila";
  const selectedCourt = React.useMemo(
    () => courts.find((court) => court.id === courtId),
    [courtId, courts],
  );

  const [dayKeyParam, setDayKeyParam] = useQueryState(
    "dayKey",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [viewParam, setViewParam] = useQueryState(
    "view",
    parseAsStringLiteral(studioViewSchema).withOptions({ history: "replace" }),
  );
  const [jobIdParam, setJobIdParam] = useQueryState(
    "jobId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const jobId = jobIdParam ?? "";

  const view = viewParam ?? "week";
  const isWeekView = view === "week";
  const isMobile = useIsMobile();

  const fallbackDayKey = React.useMemo(
    () => getZonedDayKey(getZonedToday(placeTimeZone), placeTimeZone),
    [placeTimeZone],
  );
  const dayKey = dayKeyParam ?? fallbackDayKey;

  React.useEffect(() => {
    if (!dayKeyParam) {
      setDayKeyParam(fallbackDayKey);
    }
  }, [dayKeyParam, fallbackDayKey, setDayKeyParam]);

  React.useEffect(() => {
    if (isMobile && view !== "day") {
      setViewParam("day");
    }
  }, [isMobile, setViewParam, view]);

  const jobQuery = trpc.bookingsImport.getJob.useQuery(
    { jobId },
    { enabled: Boolean(jobId) },
  );
  const rowsQuery = trpc.bookingsImport.listRows.useQuery(
    { jobId },
    { enabled: Boolean(jobId) },
  );

  React.useEffect(() => {
    if (!jobQuery.data?.placeId) return;
    if (jobQuery.data.placeId !== placeId) {
      setPlaceId(jobQuery.data.placeId);
    }
  }, [jobQuery.data?.placeId, placeId, setPlaceId]);

  React.useEffect(() => {
    if (placesLoading || places.length === 0) return;
    if (!placeId || !places.some((place) => place.id === placeId)) {
      setPlaceId(places[0].id);
    }
  }, [placeId, places, placesLoading, setPlaceId]);

  React.useEffect(() => {
    if (!placeId) {
      setCourtId("");
      return;
    }
    if (courtsLoading) return;
    if (courts.length === 0) return;
    if (!courtId || !courts.some((court) => court.id === courtId)) {
      setCourtId(courts[0].id);
    }
  }, [courtId, courts, courtsLoading, placeId, setCourtId]);

  React.useEffect(() => {
    const metadata = jobQuery.data?.metadata as Record<string, unknown> | null;
    const selectedCourtId =
      metadata && typeof metadata.selectedCourtId === "string"
        ? metadata.selectedCourtId
        : null;
    if (!selectedCourtId) return;
    if (courts.some((court) => court.id === selectedCourtId)) {
      setCourtId(selectedCourtId);
    }
  }, [courts, jobQuery.data?.metadata, setCourtId]);

  const isImportOverlay = Boolean(jobId);
  const job = jobQuery.data;
  const isImportEditable = job?.status === "NORMALIZED";
  const draftRows = (rowsQuery.data ?? []) as DraftRowItem[];
  const draftRowsById = React.useMemo(
    () => new Map(draftRows.map((row) => [row.id, row])),
    [draftRows],
  );
  const draftRowsSorted = React.useMemo(() => {
    return [...draftRows].sort((a, b) => {
      const statusA = (a.status ?? "PENDING") as DraftRowStatus;
      const statusB = (b.status ?? "PENDING") as DraftRowStatus;
      const priorityA = DRAFT_STATUS_PRIORITY[statusA] ?? 99;
      const priorityB = DRAFT_STATUS_PRIORITY[statusB] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.lineNumber - b.lineNumber;
    });
  }, [draftRows]);
  const canCommitImport = Boolean(
    job && isImportEditable && (job.errorRowCount ?? 0) === 0,
  );

  const selectedDayRange = React.useMemo(
    () => getZonedDayRangeFromDayKey(dayKey, placeTimeZone),
    [dayKey, placeTimeZone],
  );
  const selectedDayStart = selectedDayRange.start;
  const selectedDate = React.useMemo(
    () => new Date(selectedDayStart.getTime()),
    [selectedDayStart],
  );
  const selectedDayLabel = React.useMemo(
    () =>
      formatInTimeZone(selectedDayStart, placeTimeZone, "EEEE, MMMM d, yyyy"),
    [placeTimeZone, selectedDayStart],
  );
  const weekStartsOn = 0;
  const weekStartDayKey = React.useMemo(() => {
    const dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
    const dayOfWeek = dayStart.getDay();
    const delta = (dayOfWeek - weekStartsOn + 7) % 7;
    const weekStart = addDays(dayStart, -delta);
    return getZonedDayKey(weekStart, placeTimeZone);
  }, [dayKey, placeTimeZone]);

  const weekDayKeys = React.useMemo(() => {
    const start = getZonedDayRangeFromDayKey(
      weekStartDayKey,
      placeTimeZone,
    ).start;
    return Array.from({ length: 7 }, (_, index) =>
      getZonedDayKey(addDays(start, index), placeTimeZone),
    );
  }, [placeTimeZone, weekStartDayKey]);

  const weekLabel = React.useMemo(() => {
    const weekStart = getZonedDayRangeFromDayKey(
      weekDayKeys[0] ?? weekStartDayKey,
      placeTimeZone,
    ).start;
    const weekEnd = getZonedDayRangeFromDayKey(
      weekDayKeys[6] ?? weekStartDayKey,
      placeTimeZone,
    ).start;
    return `${formatInTimeZone(weekStart, placeTimeZone, "MMM d")} - ${formatInTimeZone(
      weekEnd,
      placeTimeZone,
      "MMM d, yyyy",
    )}`;
  }, [placeTimeZone, weekDayKeys, weekStartDayKey]);

  const todayDate = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(todayDate, placeTimeZone),
    [placeTimeZone, todayDate],
  );

  const handleMobileDateSelect = React.useCallback(
    (date: Date) => {
      setDayKeyParam(getZonedDayKey(date, placeTimeZone));
    },
    [placeTimeZone, setDayKeyParam],
  );

  const handleMobileToday = React.useCallback(() => {
    setDayKeyParam(getZonedDayKey(todayDate, placeTimeZone));
  }, [placeTimeZone, setDayKeyParam, todayDate]);

  const navigateMonth = React.useCallback(
    (direction: 1 | -1) => {
      const current = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
      const targetMonth = addMonths(current, direction);
      const lastDay = endOfMonth(targetMonth);
      const targetDay = Math.min(current.getDate(), lastDay.getDate());
      const targetDate = new TZDate(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        targetDay,
        placeTimeZone,
      );
      setDayKeyParam(getZonedDayKey(targetDate, placeTimeZone));
    },
    [dayKey, placeTimeZone, setDayKeyParam],
  );

  const visibleDayKeys = React.useMemo(() => {
    if (isWeekView) return weekDayKeys;
    return [dayKey];
  }, [dayKey, isWeekView, weekDayKeys]);

  // Store reads
  const calendarMonth = useBookingStudio((s) => s.calendarMonth);
  const setCalendarMonth = useBookingStudio((s) => s.setCalendarMonth);
  const mobileCalendarOpen = useBookingStudio((s) => s.mobileCalendarOpen);
  const setMobileCalendarOpen = useBookingStudio(
    (s) => s.setMobileCalendarOpen,
  );
  const pendingRemoveBlockId = useBookingStudio((s) => s.pendingRemoveBlockId);
  const setPendingRemoveBlockId = useBookingStudio(
    (s) => s.setPendingRemoveBlockId,
  );
  const guestBookingOpen = useBookingStudio((s) => s.guestBookingOpen);
  const closeGuestBookingDialog = useBookingStudio(
    (s) => s.closeGuestBookingDialog,
  );
  const setCustomDialogOpen = useBookingStudio((s) => s.setCustomDialogOpen);
  const setMobileDrawerOpen = useBookingStudio((s) => s.setMobileDrawerOpen);
  const selectionBlockType = useBookingStudio((s) => s.selectionBlockType);
  const setSelectionBlockType = useBookingStudio(
    (s) => s.setSelectionBlockType,
  );
  const committedRange = useBookingStudio((s) => s.committedRange);
  const setCommittedRange = useBookingStudio((s) => s.setCommittedRange);
  const guestModeState = useBookingStudio((s) => s.guestModeState);
  const setGuestMode = useBookingStudio((s) => s.setGuestMode);
  const setGuestModeState = useBookingStudio((s) => s.setGuestModeState);
  const setGuestName = useBookingStudio((s) => s.setGuestName);
  const setGuestPhone = useBookingStudio((s) => s.setGuestPhone);
  const setGuestEmail = useBookingStudio((s) => s.setGuestEmail);
  const setGuestProfileId = useBookingStudio((s) => s.setGuestProfileId);
  const setNotes = useBookingStudio((s) => s.setNotes);
  const debouncedGuestSearch = useBookingStudio((s) => s.debouncedGuestSearch);
  const setDebouncedGuestSearch = useBookingStudio(
    (s) => s.setDebouncedGuestSearch,
  );
  const guestSearch = useBookingStudio((s) => s.guestSearch);
  const resetSelectionPanel = useBookingStudio((s) => s.resetSelectionPanel);

  React.useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate, setCalendarMonth]);

  // Guest search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedGuestSearch(guestSearch), 300);
    return () => clearTimeout(timer);
  }, [guestSearch, setDebouncedGuestSearch]);

  const courtHoursQuery = useCourtHours(courtId);
  const dayOfWeek = getZonedDate(selectedDayStart, placeTimeZone).getDay();
  const selectedTimelineRange = React.useMemo(
    () => parseTimelineRange(courtHoursQuery.data ?? [], dayOfWeek),
    [courtHoursQuery.data, dayOfWeek],
  );
  const timelineRange = React.useMemo(() => {
    if (!isWeekView) return selectedTimelineRange;

    const windows = courtHoursQuery.data ?? [];
    if (weekDayKeys.length === 0) return selectedTimelineRange;

    const ranges = weekDayKeys.map((dk) => {
      const dayStart = getZonedDayRangeFromDayKey(dk, placeTimeZone).start;
      const dow = getZonedDate(dayStart, placeTimeZone).getDay();
      return parseTimelineRange(windows, dow);
    });

    return {
      startHour: Math.min(...ranges.map((range) => range.startHour)),
      endHour: Math.max(...ranges.map((range) => range.endHour)),
    };
  }, [
    courtHoursQuery.data,
    isWeekView,
    placeTimeZone,
    selectedTimelineRange,
    weekDayKeys,
  ]);

  const { startHour, endHour } = timelineRange;

  const hours = React.useMemo(
    () =>
      Array.from(
        { length: endHour - startHour },
        (_, index) => startHour + index,
      ),
    [endHour, startHour],
  );

  const timelineStartMinute = startHour * 60;
  const timelineEndMinute = endHour * 60;

  const blocksRange = React.useMemo(() => {
    const startDayKey = visibleDayKeys[0] ?? dayKey;
    const endDayKey = visibleDayKeys[visibleDayKeys.length - 1] ?? dayKey;
    return {
      start: getZonedDayRangeFromDayKey(startDayKey, placeTimeZone).start,
      end: getZonedDayRangeFromDayKey(endDayKey, placeTimeZone).end,
    };
  }, [dayKey, placeTimeZone, visibleDayKeys]);
  const blocksRangeStartIso = React.useMemo(
    () => toUtcISOString(blocksRange.start),
    [blocksRange.start],
  );
  const blocksRangeEndIso = React.useMemo(
    () => toUtcISOString(blocksRange.end),
    [blocksRange.end],
  );

  const blocksQueryInput = React.useMemo(
    () => ({
      courtId,
      startTime: blocksRangeStartIso,
      endTime: blocksRangeEndIso,
    }),
    [courtId, blocksRangeStartIso, blocksRangeEndIso],
  );

  const blocksQuery = trpc.courtBlock.listForCourtRange.useQuery(
    blocksQueryInput,
    { enabled: Boolean(courtId) },
  );

  const reservationsQueryInput = React.useMemo(
    () => ({
      courtId,
      startTime: blocksRangeStartIso,
      endTime: blocksRangeEndIso,
    }),
    [courtId, blocksRangeStartIso, blocksRangeEndIso],
  );

  const reservationsQuery =
    trpc.reservationOwner.getActiveForCourtRange.useQuery(
      reservationsQueryInput,
      { enabled: Boolean(courtId) },
    );

  const activeReservations = React.useMemo(
    () => (reservationsQuery.data ?? []) as ReservationItem[],
    [reservationsQuery.data],
  );

  const activeBlocks = React.useMemo(
    () =>
      ((blocksQuery.data ?? []) as CourtBlockItem[]).filter(
        (block) => block.isActive,
      ),
    [blocksQuery.data],
  );

  const selectedDayEndExclusive = React.useMemo(
    () => addDays(selectedDayStart, 1),
    [selectedDayStart],
  );

  const activeBlocksForSelectedDay = React.useMemo(() => {
    return activeBlocks.filter((block) => {
      const startTime = new Date(block.startTime);
      const endTime = new Date(block.endTime);
      return startTime < selectedDayEndExclusive && endTime > selectedDayStart;
    });
  }, [activeBlocks, selectedDayEndExclusive, selectedDayStart]);

  const dayBlocks = React.useMemo(
    () =>
      [...activeBlocksForSelectedDay].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [activeBlocksForSelectedDay],
  );

  const timelineBlocks = React.useMemo(() => {
    return activeBlocksForSelectedDay
      .map((block) => {
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);

        if (
          startTime >= selectedDayEndExclusive ||
          endTime <= selectedDayStart
        ) {
          return null;
        }

        const segmentStart =
          startTime > selectedDayStart ? startTime : selectedDayStart;
        const segmentEnd =
          endTime < selectedDayEndExclusive ? endTime : selectedDayEndExclusive;

        const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
        const endMinute = getEndMinuteForDayKey(
          dayKey,
          segmentEnd,
          placeTimeZone,
        );

        if (
          endMinute <= timelineStartMinute ||
          startMinute >= timelineEndMinute
        ) {
          return null;
        }

        const clampedStart = Math.max(startMinute, timelineStartMinute);
        const clampedEnd = Math.min(endMinute, timelineEndMinute);
        const topOffset =
          ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
        const height = ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

        return {
          block,
          topOffset,
          height,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [
    activeBlocksForSelectedDay,
    dayKey,
    placeTimeZone,
    selectedDayEndExclusive,
    selectedDayStart,
    timelineEndMinute,
    timelineStartMinute,
  ]);

  const weekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map<
        string,
        Array<{ block: CourtBlockItem; topOffset: number; height: number }>
      >();
    }

    const byDayKey = new Map<
      string,
      Array<{ block: CourtBlockItem; topOffset: number; height: number }>
    >();

    for (const dk of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dk, placeTimeZone).start;
      const dayEndExclusive = addDays(dayStart, 1);

      const items = activeBlocks
        .map((block) => {
          const startTime = new Date(block.startTime);
          const endTime = new Date(block.endTime);
          if (startTime >= dayEndExclusive || endTime <= dayStart) return null;

          const segmentStart = startTime > dayStart ? startTime : dayStart;
          const segmentEnd =
            endTime < dayEndExclusive ? endTime : dayEndExclusive;
          const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
          const endMinute = getEndMinuteForDayKey(
            dk,
            segmentEnd,
            placeTimeZone,
          );

          if (
            endMinute <= timelineStartMinute ||
            startMinute >= timelineEndMinute
          ) {
            return null;
          }

          const clampedStart = Math.max(startMinute, timelineStartMinute);
          const clampedEnd = Math.min(endMinute, timelineEndMinute);
          const topOffset =
            ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { block, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dk, items);
    }

    return byDayKey;
  }, [
    activeBlocks,
    isWeekView,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
    weekDayKeys,
  ]);

  const timelineReservations = React.useMemo(() => {
    return activeReservations
      .map((res) => {
        const startTime = new Date(res.startTime);
        const endTime = new Date(res.endTime);

        if (
          startTime >= selectedDayEndExclusive ||
          endTime <= selectedDayStart
        ) {
          return null;
        }

        const segmentStart =
          startTime > selectedDayStart ? startTime : selectedDayStart;
        const segmentEnd =
          endTime < selectedDayEndExclusive ? endTime : selectedDayEndExclusive;

        const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
        const endMinute = getEndMinuteForDayKey(
          dayKey,
          segmentEnd,
          placeTimeZone,
        );

        if (
          endMinute <= timelineStartMinute ||
          startMinute >= timelineEndMinute
        ) {
          return null;
        }

        const clampedStart = Math.max(startMinute, timelineStartMinute);
        const clampedEnd = Math.min(endMinute, timelineEndMinute);
        const topOffset =
          ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
        const height = ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

        return { reservation: res, topOffset, height };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [
    activeReservations,
    dayKey,
    placeTimeZone,
    selectedDayEndExclusive,
    selectedDayStart,
    timelineEndMinute,
    timelineStartMinute,
  ]);

  const weekTimelineReservationsByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map<
        string,
        Array<{
          reservation: ReservationItem;
          topOffset: number;
          height: number;
        }>
      >();
    }

    const byDayKey = new Map<
      string,
      Array<{
        reservation: ReservationItem;
        topOffset: number;
        height: number;
      }>
    >();

    for (const dk of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dk, placeTimeZone).start;
      const dayEndExclusive = addDays(dayStart, 1);

      const items = activeReservations
        .map((res) => {
          const startTime = new Date(res.startTime);
          const endTime = new Date(res.endTime);
          if (startTime >= dayEndExclusive || endTime <= dayStart) return null;

          const segmentStart = startTime > dayStart ? startTime : dayStart;
          const segmentEnd =
            endTime < dayEndExclusive ? endTime : dayEndExclusive;
          const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
          const endMinute = getEndMinuteForDayKey(
            dk,
            segmentEnd,
            placeTimeZone,
          );

          if (
            endMinute <= timelineStartMinute ||
            startMinute >= timelineEndMinute
          ) {
            return null;
          }

          const clampedStart = Math.max(startMinute, timelineStartMinute);
          const clampedEnd = Math.min(endMinute, timelineEndMinute);
          const topOffset =
            ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { reservation: res, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dk, items);
    }

    return byDayKey;
  }, [
    activeReservations,
    isWeekView,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
    weekDayKeys,
  ]);

  const draftTimelineBlocks = React.useMemo(() => {
    if (!isImportOverlay)
      return [] as Array<{
        row: (typeof draftRows)[number];
        topOffset: number;
        height: number;
      }>;

    return draftRows
      .filter((row) => row.status !== "COMMITTED" && row.status !== "SKIPPED")
      .filter((row) => row.startTime && row.endTime)
      .filter((row) => (courtId ? row.courtId === courtId : true))
      .map((row) => {
        const startTime = new Date(row.startTime as Date | string);
        const endTime = new Date(row.endTime as Date | string);
        if (
          startTime >= selectedDayEndExclusive ||
          endTime <= selectedDayStart
        ) {
          return null;
        }

        const segmentStart =
          startTime > selectedDayStart ? startTime : selectedDayStart;
        const segmentEnd =
          endTime < selectedDayEndExclusive ? endTime : selectedDayEndExclusive;
        const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
        const endMinute = getEndMinuteForDayKey(
          dayKey,
          segmentEnd,
          placeTimeZone,
        );
        if (
          endMinute <= timelineStartMinute ||
          startMinute >= timelineEndMinute
        ) {
          return null;
        }

        const clampedStart = Math.max(startMinute, timelineStartMinute);
        const clampedEnd = Math.min(endMinute, timelineEndMinute);
        const topOffset =
          ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
        const height = ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

        return {
          row,
          topOffset,
          height,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [
    courtId,
    dayKey,
    draftRows,
    isImportOverlay,
    placeTimeZone,
    selectedDayEndExclusive,
    selectedDayStart,
    timelineEndMinute,
    timelineStartMinute,
  ]);

  const draftWeekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isImportOverlay || !isWeekView) {
      return new Map<
        string,
        Array<{ row: DraftRowItem; topOffset: number; height: number }>
      >();
    }

    const byDayKey = new Map<
      string,
      Array<{ row: DraftRowItem; topOffset: number; height: number }>
    >();

    for (const dk of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dk, placeTimeZone).start;
      const dayEndExclusive = addDays(dayStart, 1);

      const items = draftRows
        .filter((row) => row.status !== "COMMITTED" && row.status !== "SKIPPED")
        .filter((row) => row.startTime && row.endTime)
        .filter((row) => (courtId ? row.courtId === courtId : true))
        .map((row) => {
          const startTime = new Date(row.startTime as Date | string);
          const endTime = new Date(row.endTime as Date | string);
          if (startTime >= dayEndExclusive || endTime <= dayStart) return null;

          const segmentStart = startTime > dayStart ? startTime : dayStart;
          const segmentEnd =
            endTime < dayEndExclusive ? endTime : dayEndExclusive;
          const startMinute = getMinuteOfDay(segmentStart, placeTimeZone);
          const endMinute = getEndMinuteForDayKey(
            dk,
            segmentEnd,
            placeTimeZone,
          );
          if (
            endMinute <= timelineStartMinute ||
            startMinute >= timelineEndMinute
          ) {
            return null;
          }

          const clampedStart = Math.max(startMinute, timelineStartMinute);
          const clampedEnd = Math.min(endMinute, timelineEndMinute);
          const topOffset =
            ((clampedStart - timelineStartMinute) / 60) * TIMELINE_ROW_HEIGHT;
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { row, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dk, items);
    }

    return byDayKey;
  }, [
    courtId,
    draftRows,
    isImportOverlay,
    isWeekView,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
    weekDayKeys,
  ]);

  const utils = trpc.useUtils();
  const [pendingBlockIds, setPendingBlockIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const pendingBlockIdCounts = React.useRef<Map<string, number>>(new Map());
  const updatePendingBlockId = React.useCallback(
    (blockId: string, delta: 1 | -1) => {
      const nextCounts = new Map(pendingBlockIdCounts.current);
      const nextCount = (nextCounts.get(blockId) ?? 0) + delta;
      if (nextCount <= 0) {
        nextCounts.delete(blockId);
      } else {
        nextCounts.set(blockId, nextCount);
      }
      pendingBlockIdCounts.current = nextCounts;
      setPendingBlockIds(new Set(nextCounts.keys()));
    },
    [],
  );

  const scheduleRangeFlushRef = React.useRef<(blockId: string) => void>(
    () => {},
  );

  const pendingRangeUpdates = React.useRef<
    Map<string, { startTime: string; endTime: string; version: number }>
  >(new Map());
  const rangeUpdateVersions = React.useRef<Map<string, number>>(new Map());
  const debouncedFlushByBlock = React.useRef<
    Map<string, ReturnType<typeof debounce>>
  >(new Map());

  const applyPendingRangeUpdate = (
    serverBlock: CourtBlockItem,
    optimisticId?: string,
  ) => {
    if (!optimisticId) return serverBlock;
    const pending = pendingRangeUpdates.current.get(optimisticId);
    if (!pending) return serverBlock;

    pendingRangeUpdates.current.delete(optimisticId);
    rangeUpdateVersions.current.delete(optimisticId);

    rangeUpdateVersions.current.set(serverBlock.id, pending.version);
    pendingRangeUpdates.current.set(serverBlock.id, {
      ...pending,
      version: pending.version,
    });
    scheduleRangeFlushRef.current(serverBlock.id);

    return {
      ...serverBlock,
      startTime: pending.startTime,
      endTime: pending.endTime,
    };
  };

  const createMaintenance = trpc.courtBlock.createMaintenance.useMutation({
    async onMutate(variables) {
      const optimisticId = generateOptimisticId();
      const nowIso = new Date().toISOString();
      await utils.courtBlock.listForCourtRange.cancel(blocksQueryInput);
      const previousBlocks =
        utils.courtBlock.listForCourtRange.getData(blocksQueryInput);

      const optimisticBlock: CourtBlockItem = {
        id: optimisticId,
        courtId: variables.courtId,
        type: "MAINTENANCE",
        startTime: variables.startTime,
        endTime: variables.endTime,
        reason: variables.reason ?? null,
        totalPriceCents: 0,
        currency: "PHP",
        isActive: true,
        cancelledAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      utils.courtBlock.listForCourtRange.setData(blocksQueryInput, (old) =>
        old ? [...old, optimisticBlock] : [optimisticBlock],
      );
      updatePendingBlockId(optimisticId, 1);

      return { previousBlocks, optimisticId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        utils.courtBlock.listForCourtRange.setData(
          blocksQueryInput,
          context.previousBlocks,
        );
      }
      if (context?.optimisticId) {
        updatePendingBlockId(context.optimisticId, -1);
        pendingRangeUpdates.current.delete(context.optimisticId);
        rangeUpdateVersions.current.delete(context.optimisticId);
        const debounced = debouncedFlushByBlock.current.get(
          context.optimisticId,
        );
        if (debounced) {
          debounced.clear();
          debouncedFlushByBlock.current.delete(context.optimisticId);
        }
      }
    },
    onSuccess(serverBlock, _variables, context) {
      const nextBlock = applyPendingRangeUpdate(
        serverBlock,
        context?.optimisticId,
      );
      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) =>
          old?.map((block) =>
            block.id === context?.optimisticId ? nextBlock : block,
          ) ?? [nextBlock],
      );
      if (context?.optimisticId) {
        updatePendingBlockId(context.optimisticId, -1);
      }
    },
    onSettled() {
      void utils.courtBlock.listForCourtRange.invalidate(blocksQueryInput);
    },
  });

  const createWalkIn = trpc.courtBlock.createWalkIn.useMutation({
    async onMutate(variables) {
      const optimisticId = generateOptimisticId();
      const nowIso = new Date().toISOString();
      await utils.courtBlock.listForCourtRange.cancel(blocksQueryInput);
      const previousBlocks =
        utils.courtBlock.listForCourtRange.getData(blocksQueryInput);

      const optimisticBlock: CourtBlockItem = {
        id: optimisticId,
        courtId: variables.courtId,
        type: "WALK_IN",
        startTime: variables.startTime,
        endTime: variables.endTime,
        reason: variables.reason ?? null,
        totalPriceCents: 0,
        currency: "PHP",
        isActive: true,
        cancelledAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      utils.courtBlock.listForCourtRange.setData(blocksQueryInput, (old) =>
        old ? [...old, optimisticBlock] : [optimisticBlock],
      );
      updatePendingBlockId(optimisticId, 1);

      return { previousBlocks, optimisticId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        utils.courtBlock.listForCourtRange.setData(
          blocksQueryInput,
          context.previousBlocks,
        );
      }
      if (context?.optimisticId) {
        updatePendingBlockId(context.optimisticId, -1);
        pendingRangeUpdates.current.delete(context.optimisticId);
        rangeUpdateVersions.current.delete(context.optimisticId);
        const debounced = debouncedFlushByBlock.current.get(
          context.optimisticId,
        );
        if (debounced) {
          debounced.clear();
          debouncedFlushByBlock.current.delete(context.optimisticId);
        }
      }
    },
    onSuccess(serverBlock, _variables, context) {
      const nextBlock = applyPendingRangeUpdate(
        serverBlock,
        context?.optimisticId,
      );
      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) =>
          old?.map((block) =>
            block.id === context?.optimisticId ? nextBlock : block,
          ) ?? [nextBlock],
      );
      if (context?.optimisticId) {
        updatePendingBlockId(context.optimisticId, -1);
      }
    },
    onSettled() {
      void utils.courtBlock.listForCourtRange.invalidate(blocksQueryInput);
    },
  });

  const cancelBlock = trpc.courtBlock.cancel.useMutation({
    async onMutate(variables) {
      await utils.courtBlock.listForCourtRange.cancel(blocksQueryInput);
      const previousBlocks =
        utils.courtBlock.listForCourtRange.getData(blocksQueryInput);

      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) => old?.filter((block) => block.id !== variables.blockId) ?? [],
      );
      updatePendingBlockId(variables.blockId, 1);

      return { previousBlocks, blockId: variables.blockId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        utils.courtBlock.listForCourtRange.setData(
          blocksQueryInput,
          context.previousBlocks,
        );
      }
      if (context?.blockId) {
        updatePendingBlockId(context.blockId, -1);
      }
    },
    onSuccess(_data, _variables, context) {
      if (context?.blockId) {
        updatePendingBlockId(context.blockId, -1);
      }
    },
    onSettled() {
      void utils.courtBlock.listForCourtRange.invalidate(blocksQueryInput);
    },
  });

  const updateRange = trpc.courtBlock.updateRange.useMutation();

  const flushBlockRangeUpdate = React.useCallback(
    async (blockId: string) => {
      const pending = pendingRangeUpdates.current.get(blockId);
      if (!pending) return;
      pendingRangeUpdates.current.delete(blockId);

      updatePendingBlockId(blockId, 1);

      try {
        const serverBlock = await updateRange.mutateAsync({
          blockId,
          startTime: pending.startTime,
          endTime: pending.endTime,
        });
        const latestVersion = rangeUpdateVersions.current.get(blockId);
        if (latestVersion !== pending.version) return;

        const rangeStart = new Date(blocksRangeStartIso);
        const rangeEnd = new Date(blocksRangeEndIso);
        const blockStart = new Date(serverBlock.startTime);
        const blockEnd = new Date(serverBlock.endTime);
        const isInRange = blockStart < rangeEnd && blockEnd > rangeStart;

        utils.courtBlock.listForCourtRange.setData(blocksQueryInput, (old) => {
          const existing = old ?? [];
          const filtered = existing.filter((block) => block.id !== blockId);
          if (!isInRange) return filtered;
          return [...filtered, serverBlock];
        });
        toast.success("Block updated");
      } catch (error) {
        const latestVersion = rangeUpdateVersions.current.get(blockId);
        if (latestVersion === pending.version) {
          void utils.courtBlock.listForCourtRange.invalidate(blocksQueryInput);
          toast.error("Unable to update block", {
            description: getClientErrorMessage(error, "Please try again"),
          });
        }
      } finally {
        updatePendingBlockId(blockId, -1);
      }
    },
    [
      blocksQueryInput,
      blocksRangeEndIso,
      blocksRangeStartIso,
      updatePendingBlockId,
      updateRange,
      utils,
    ],
  );

  const scheduleRangeFlush = React.useCallback(
    (blockId: string) => {
      let debounced = debouncedFlushByBlock.current.get(blockId);
      if (!debounced) {
        debounced = debounce(
          (id: string) => void flushBlockRangeUpdate(id),
          2000,
        );
        debouncedFlushByBlock.current.set(blockId, debounced);
      }
      debounced(blockId);
    },
    [flushBlockRangeUpdate],
  );

  scheduleRangeFlushRef.current = scheduleRangeFlush;

  React.useEffect(
    () => () => {
      for (const debounced of debouncedFlushByBlock.current.values()) {
        debounced.clear();
      }
    },
    [],
  );

  const draftRowsQueryInput = React.useMemo(() => ({ jobId }), [jobId]);

  const updateDraftRow = trpc.bookingsImport.updateRow.useMutation({
    async onMutate(variables) {
      if (!jobId) return { previousRows: undefined };
      await utils.bookingsImport.listRows.cancel(draftRowsQueryInput);
      const previousRows =
        utils.bookingsImport.listRows.getData(draftRowsQueryInput);

      utils.bookingsImport.listRows.setData(draftRowsQueryInput, (old) =>
        old?.map((row) => {
          if (row.id !== variables.rowId) return row;

          const startTime: string | null =
            variables.startTime === undefined
              ? row.startTime
              : variables.startTime instanceof Date
                ? toUtcISOString(variables.startTime)
                : null;
          const endTime: string | null =
            variables.endTime === undefined
              ? row.endTime
              : variables.endTime instanceof Date
                ? toUtcISOString(variables.endTime)
                : null;
          const courtId: string | null =
            variables.courtId === undefined
              ? row.courtId
              : (variables.courtId as string | null);
          const courtLabel: string | null =
            variables.courtLabel === undefined
              ? row.courtLabel
              : (variables.courtLabel as string | null);

          return {
            ...row,
            startTime,
            endTime,
            courtId,
            courtLabel,
          };
        }),
      );

      return { previousRows };
    },
    onError(_error, _variables, context) {
      if (context?.previousRows !== undefined && jobId) {
        utils.bookingsImport.listRows.setData(
          draftRowsQueryInput,
          context.previousRows,
        );
      }
    },
    onSettled() {
      if (jobId) {
        void utils.bookingsImport.listRows.invalidate(draftRowsQueryInput);
        void utils.bookingsImport.getJob.invalidate({ jobId });
      }
    },
  });

  const commitImport = trpc.bookingsImport.commit.useMutation();
  const discardImport = trpc.bookingsImport.discardJob.useMutation();

  const invalidateDraftRows = React.useCallback(() => {
    if (!jobId) return;
    void utils.bookingsImport.listRows.invalidate({ jobId });
    void utils.bookingsImport.getJob.invalidate({ jobId });
  }, [jobId, utils]);

  const handleCancelBlock = React.useCallback(
    (
      blockId: string,
      options?: { skipConfirm?: boolean; silent?: boolean },
    ) => {
      if (options?.skipConfirm) {
        cancelBlock
          .mutateAsync({ blockId })
          .then(() => {
            if (!options?.silent) toast.success("Block removed");
          })
          .catch((error: unknown) => {
            toast.error("Unable to remove block", {
              description: getClientErrorMessage(error, "Please try again"),
            });
          });
        return;
      }
      setPendingRemoveBlockId(blockId);
    },
    [cancelBlock, setPendingRemoveBlockId],
  );

  const confirmRemoveBlock = React.useCallback(async () => {
    if (!pendingRemoveBlockId) return;
    const blockId = pendingRemoveBlockId;
    setPendingRemoveBlockId(null);
    try {
      await cancelBlock.mutateAsync({ blockId });
      toast.success("Block removed");
    } catch (error) {
      toast.error("Unable to remove block", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  }, [cancelBlock, pendingRemoveBlockId, setPendingRemoveBlockId]);

  // Guest booking form
  const guestBookingForm = useForm<GuestBookingFormValues>({
    resolver: zodResolver(guestBookingFormSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      guestMode: "existing",
      guestProfileId: "",
      newGuestName: "",
      newGuestPhone: "",
      newGuestEmail: "",
      notes: "",
    },
  });

  const guestProfilesQuery = trpc.guestProfile.list.useQuery(
    {
      organizationId: organization?.id ?? "",
      query: debouncedGuestSearch || undefined,
      limit: 50,
    },
    { enabled: guestBookingOpen && !!organization?.id },
  );
  const createGuestProfile = trpc.guestProfile.create.useMutation();
  const createGuestBooking =
    trpc.reservationOwner.createGuestBooking.useMutation({
      onSettled() {
        void utils.courtBlock.listForCourtRange.invalidate(blocksQueryInput);
        void utils.reservationOwner.getActiveForCourtRange.invalidate(
          reservationsQueryInput,
        );
      },
    });

  const handleGuestBookingSubmit = React.useCallback(
    async (values: GuestBookingFormValues) => {
      if (!courtId) {
        toast.error("Select a court first");
        return;
      }
      const start = parseDateTimeInput(values.startTime, placeTimeZone);
      const end = parseDateTimeInput(values.endTime, placeTimeZone);
      if (!start || !end) {
        toast.error("Invalid date or time");
        return;
      }

      try {
        let guestProfileId = values.guestProfileId;

        if (values.guestMode === "new") {
          if (!values.newGuestName?.trim()) {
            toast.error("Guest name is required");
            return;
          }
          const guest = await createGuestProfile.mutateAsync({
            organizationId: organization?.id ?? "",
            displayName: values.newGuestName.trim(),
            phoneNumber: values.newGuestPhone?.trim() || undefined,
            email: values.newGuestEmail?.trim() || undefined,
          });
          guestProfileId = guest.id;
        }

        if (!guestProfileId) {
          toast.error("Please select or create a guest");
          return;
        }

        await createGuestBooking.mutateAsync({
          courtId,
          startTime: toUtcISOString(start),
          endTime: toUtcISOString(end),
          guestProfileId,
          notes: values.notes?.trim() || undefined,
        });

        toast.success("Guest booking added");
        closeGuestBookingDialog();
      } catch (error) {
        toast.error("Unable to add guest booking", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      closeGuestBookingDialog,
      courtId,
      createGuestBooking,
      createGuestProfile,
      organization?.id,
      placeTimeZone,
    ],
  );

  const handleDraftRowDrop = React.useCallback(
    async (rowId: string, dropDayKey: string, startMinute: number) => {
      if (!jobId || !isImportEditable) {
        toast.error("Import rows are not editable yet");
        return;
      }

      const row = draftRowsById.get(rowId);
      if (!row) return;

      const durationMinutes =
        row.startTime && row.endTime
          ? Math.max(
              differenceInMinutes(
                new Date(row.endTime),
                new Date(row.startTime),
              ),
              60,
            )
          : 60;
      const start = buildDateFromDayKey(dropDayKey, startMinute, placeTimeZone);
      const end = addMinutes(start, durationMinutes);

      try {
        await updateDraftRow.mutateAsync({
          rowId,
          startTime: start,
          endTime: end,
          courtId: selectedCourt?.id ?? undefined,
          courtLabel: selectedCourt?.label ?? undefined,
        });
        toast.success("Draft row updated");
      } catch (error) {
        toast.error("Unable to update draft row", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      draftRowsById,
      isImportEditable,
      jobId,
      placeTimeZone,
      selectedCourt?.id,
      selectedCourt?.label,
      updateDraftRow,
    ],
  );

  const handleCommitImport = React.useCallback(async () => {
    if (!jobId) return;
    try {
      const result = await commitImport.mutateAsync({ jobId });
      invalidateDraftRows();
      if (result.failedRows > 0) {
        toast.warning(
          `Committed ${result.committedRows} rows. ${result.failedRows} failed.`,
        );
      } else {
        toast.success(`Committed ${result.committedRows} rows.`);
      }
    } catch (error) {
      toast.error("Unable to commit import", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  }, [commitImport, invalidateDraftRows, jobId]);

  const handleDiscardImport = React.useCallback(async () => {
    if (!jobId) return;
    const confirmed = window.confirm("Discard this import?");
    if (!confirmed) return;
    try {
      await discardImport.mutateAsync({ jobId });
      toast.success("Import discarded");
      setJobIdParam(null);
    } catch (error) {
      toast.error("Unable to discard import", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  }, [discardImport, jobId, setJobIdParam]);

  const navigateWeek = React.useCallback(
    (direction: 1 | -1) => {
      const weekStart = getZonedDayRangeFromDayKey(
        weekDayKeys[0] ?? dayKey,
        placeTimeZone,
      ).start;
      const newDayKey = getZonedDayKey(
        addDays(weekStart, direction * 7),
        placeTimeZone,
      );
      setDayKeyParam(newDayKey);
    },
    [dayKey, placeTimeZone, setDayKeyParam, weekDayKeys],
  );

  // Mobile selection config
  const daySelectionConfig = React.useMemo<RangeSelectionConfig>(() => {
    const blockedHourIndices = new Set<number>();
    for (const { block } of timelineBlocks) {
      const blockStart = getMinuteOfDay(block.startTime, placeTimeZone);
      const blockEnd = getMinuteOfDay(block.endTime, placeTimeZone);
      for (let m = blockStart; m < blockEnd; m += 60) {
        const idx = Math.floor(m / 60) - startHour;
        if (idx >= 0 && idx < hours.length) {
          blockedHourIndices.add(idx);
        }
      }
    }
    for (const { reservation } of timelineReservations) {
      const resStart = getMinuteOfDay(reservation.startTime, placeTimeZone);
      const resEnd = getMinuteOfDay(reservation.endTime, placeTimeZone);
      for (let m = resStart; m < resEnd; m += 60) {
        const idx = Math.floor(m / 60) - startHour;
        if (idx >= 0 && idx < hours.length) {
          blockedHourIndices.add(idx);
        }
      }
    }

    return {
      isCellAvailable: (idx: number) =>
        idx >= 0 && idx < hours.length && !blockedHourIndices.has(idx),
      computeRange: (anchorIdx: number, targetIdx: number) => {
        const lo = Math.min(anchorIdx, targetIdx);
        const hi = Math.max(anchorIdx, targetIdx);
        for (let i = lo; i <= hi; i++) {
          if (blockedHourIndices.has(i)) return null;
        }
        return { startIdx: lo, endIdx: hi };
      },
      clampToContiguous: (anchorIdx: number, targetIdx: number) => {
        const dir = targetIdx >= anchorIdx ? 1 : -1;
        let current = anchorIdx;
        while (current !== targetIdx) {
          const next = current + dir;
          if (blockedHourIndices.has(next)) break;
          current = next;
        }
        return current;
      },
      commitRange: (s: number, e: number) => {
        setCommittedRange({ startIdx: s, endIdx: e });
        if (isMobile && s !== e) {
          setMobileDrawerOpen(true);
        }
      },
    };
  }, [
    hours,
    isMobile,
    placeTimeZone,
    setCommittedRange,
    setMobileDrawerOpen,
    startHour,
    timelineBlocks,
    timelineReservations,
  ]);

  // Track which day column committed the range in week view
  const [weekCommittedDayKey, setWeekCommittedDayKey] = React.useState<
    string | null
  >(null);

  const handleWeekCommitRange = React.useCallback(
    (columnDayKey: string, s: number, e: number) => {
      setCommittedRange({ startIdx: s, endIdx: e });
      setWeekCommittedDayKey(columnDayKey);
    },
    [setCommittedRange],
  );

  const handleMobileDrawerClose = React.useCallback(
    (open: boolean) => {
      setMobileDrawerOpen(open);
      if (!open) {
        setCommittedRange(null);
      }
    },
    [setCommittedRange, setMobileDrawerOpen],
  );

  // The effective dayKey for committed range display
  const committedDayKey = isWeekView ? (weekCommittedDayKey ?? dayKey) : dayKey;

  const selectedTimeLabel = React.useMemo(() => {
    if (!committedRange) return "";
    const s = buildDateFromDayKey(
      committedDayKey,
      (committedRange.startIdx + startHour) * 60,
      placeTimeZone,
    );
    const e = buildDateFromDayKey(
      committedDayKey,
      (committedRange.endIdx + startHour + 1) * 60,
      placeTimeZone,
    );
    return formatTimeRangeInTimeZone(s, e, placeTimeZone);
  }, [committedDayKey, committedRange, placeTimeZone, startHour]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const shouldReduceMotion = useReducedMotion();
  const viewTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  const handleDragStart = React.useCallback((_event: DragStartEvent) => {
    // DnD only used for draft-row import overlay now
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current as DragItem | undefined;
      const overData = over.data.current as TimelineCellData | undefined;

      if (!activeData || !overData || overData.kind !== "timeline-cell") {
        return;
      }

      if (activeData.kind === "draft-row") {
        const row = draftRowsById.get(activeData.rowId);
        if (!row) return;
        await handleDraftRowDrop(row.id, overData.dayKey, overData.startMinute);
      }
    },
    [draftRowsById, handleDraftRowDrop],
  );

  const isCreatingBlock =
    createMaintenance.isPending ||
    createWalkIn.isPending ||
    createGuestBooking.isPending;
  const isDragDisabled = !courtId;
  const isDraftDragDisabled = !isImportEditable || !courtId;

  const customForm = useForm<CustomBlockFormValues>({
    resolver: zodResolver(customBlockSchema),
    defaultValues: {
      blockType: "MAINTENANCE",
      startTime: "",
      endTime: "",
      reason: "",
    },
  });

  const openCustomDialog = React.useCallback(() => {
    const start = buildDateFromDayKey(
      dayKey,
      timelineStartMinute,
      placeTimeZone,
    );
    const end = addMinutes(start, 60);
    customForm.reset({
      blockType: "MAINTENANCE",
      startTime: formatDateTimeInput(start, placeTimeZone),
      endTime: formatDateTimeInput(end, placeTimeZone),
      reason: "",
    });
    setCustomDialogOpen(true);
  }, [
    customForm,
    dayKey,
    placeTimeZone,
    setCustomDialogOpen,
    timelineStartMinute,
  ]);

  const handleCustomSubmit = React.useCallback(
    async (values: CustomBlockFormValues) => {
      if (!courtId) {
        toast.error("Select a court first");
        return;
      }
      const start = parseDateTimeInput(values.startTime, placeTimeZone);
      const end = parseDateTimeInput(values.endTime, placeTimeZone);
      if (!start || !end) {
        toast.error("Invalid date or time", {
          description: "Please enter valid start and end times.",
        });
        return;
      }
      if (end <= start) {
        toast.error("End time must be after start time");
        return;
      }

      try {
        const payload = {
          courtId,
          startTime: toUtcISOString(start),
          endTime: toUtcISOString(end),
          reason: values.reason?.trim() || undefined,
        };

        if (values.blockType === "MAINTENANCE") {
          await createMaintenance.mutateAsync(payload);
        } else {
          await createWalkIn.mutateAsync(payload);
        }

        toast.success("Block created");
        setCustomDialogOpen(false);
      } catch (error) {
        toast.error("Unable to create block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      courtId,
      createMaintenance,
      createWalkIn,
      placeTimeZone,
      setCustomDialogOpen,
    ],
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.bookings);
  };

  // Submit handler — needs to read store state at call time.
  // We use refs to bridge the gap between hook-based store reads and callback usage.
  const guestModeRef = React.useRef<"new" | "existing">("existing");
  const guestNameRef = React.useRef("");
  const guestPhoneRef = React.useRef("");
  const guestEmailRef = React.useRef("");
  const guestProfileIdRef = React.useRef("");
  const notesRef = React.useRef("");

  // Keep refs in sync with store
  const storeGuestMode = useBookingStudio((s) => s.guestMode);
  const storeGuestName = useBookingStudio((s) => s.guestName);
  const storeGuestPhone = useBookingStudio((s) => s.guestPhone);
  const storeGuestEmail = useBookingStudio((s) => s.guestEmail);
  const storeGuestProfileId = useBookingStudio((s) => s.guestProfileId);
  const storeNotes = useBookingStudio((s) => s.notes);

  guestModeRef.current = storeGuestMode;
  guestNameRef.current = storeGuestName;
  guestPhoneRef.current = storeGuestPhone;
  guestEmailRef.current = storeGuestEmail;
  guestProfileIdRef.current = storeGuestProfileId;
  notesRef.current = storeNotes;

  const handleSelectionSubmit = React.useCallback(async () => {
    if (!courtId || !committedRange) {
      toast.error("Select a court and time range first");
      return;
    }
    const effectiveDayKey = isWeekView
      ? (weekCommittedDayKey ?? dayKey)
      : dayKey;
    const s = buildDateFromDayKey(
      effectiveDayKey,
      (committedRange.startIdx + startHour) * 60,
      placeTimeZone,
    );
    const e = buildDateFromDayKey(
      effectiveDayKey,
      (committedRange.endIdx + startHour + 1) * 60,
      placeTimeZone,
    );

    if (selectionBlockType === "GUEST_BOOKING") {
      const currentGuestMode = guestModeRef.current;
      try {
        let gProfileId = guestProfileIdRef.current;
        if (currentGuestMode === "new") {
          const name = guestNameRef.current.trim();
          if (!name) {
            toast.error("Guest name is required");
            return;
          }
          const guest = await createGuestProfile.mutateAsync({
            organizationId: organization?.id ?? "",
            displayName: name,
            phoneNumber: guestPhoneRef.current.trim() || undefined,
            email: guestEmailRef.current.trim() || undefined,
          });
          gProfileId = guest.id;
        }
        if (!gProfileId) {
          toast.error("Please select or create a guest");
          return;
        }
        await createGuestBooking.mutateAsync({
          courtId,
          startTime: toUtcISOString(s),
          endTime: toUtcISOString(e),
          guestProfileId: gProfileId,
          notes: notesRef.current.trim() || undefined,
        });
        toast.success("Guest booking added");
      } catch (error) {
        toast.error("Unable to add guest booking", {
          description: getClientErrorMessage(error, "Please try again"),
        });
        return;
      }
    } else {
      try {
        const payload = {
          courtId,
          startTime: toUtcISOString(s),
          endTime: toUtcISOString(e),
          reason: notesRef.current.trim() || undefined,
        };
        if (selectionBlockType === "MAINTENANCE") {
          await createMaintenance.mutateAsync(payload);
        } else {
          await createWalkIn.mutateAsync(payload);
        }
        toast.success("Block created");
      } catch (error) {
        toast.error("Unable to create block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
        return;
      }
    }

    resetSelectionPanel();
  }, [
    courtId,
    createGuestBooking,
    createGuestProfile,
    createMaintenance,
    createWalkIn,
    dayKey,
    isWeekView,
    selectionBlockType,
    committedRange,
    organization?.id,
    placeTimeZone,
    resetSelectionPanel,
    startHour,
    weekCommittedDayKey,
  ]);

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
            <Skeleton className="h-[520px]" />
            <Skeleton className="h-[520px]" />
            <Skeleton className="h-[520px]" />
          </div>
        </div>
      </AppShell>
    );
  }

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
      <div className="space-y-6 pb-24 lg:pb-0">
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-semibold">
            Availability Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Drag block presets onto the timeline to manage daily availability.
          </p>
        </div>

        {isImportOverlay && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-heading font-semibold">
                    Import overlay active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review and fix imported rows in context.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={appRoutes.owner.imports.bookingsReview(jobId)}>
                      Back to review
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJobIdParam(null)}
                  >
                    Exit overlay
                  </Button>
                </div>
              </div>

              {jobQuery.isLoading ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : job ? (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-medium">{job.rowCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid:</span>{" "}
                    <span className="font-medium text-green-600">
                      {job.validRowCount ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>{" "}
                    <span className="font-medium text-destructive">
                      {job.errorRowCount ?? 0}
                    </span>
                  </div>
                  {(job.committedRowCount ?? 0) > 0 ? (
                    <div>
                      <span className="text-muted-foreground">Committed:</span>{" "}
                      <span className="font-medium">
                        {job.committedRowCount}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Import job not found.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={!job || !canCommitImport || commitImport.isPending}
                  onClick={handleCommitImport}
                >
                  {commitImport.isPending ? "Committing..." : "Commit"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!job || discardImport.isPending}
                  onClick={handleDiscardImport}
                >
                  Discard import
                </Button>
                {!isImportEditable && job ? (
                  <Badge variant="secondary">Status: {job.status}</Badge>
                ) : null}
                {isImportEditable && job?.errorRowCount ? (
                  <Badge variant="warning">Fix errors to commit</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-6">
            <div className="w-full sm:w-auto sm:min-w-[220px] space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Venue
              </p>
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[220px] space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Court
              </p>
              <Select
                value={courtId}
                onValueChange={setCourtId}
                disabled={!placeId || courtsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <CalendarIcon className="h-3.5 w-3.5" />
                {placeTimeZone}
              </Badge>
              <Button
                type="button"
                variant="outline"
                className="hidden lg:inline-flex"
                onClick={() => setDayKeyParam(fallbackDayKey)}
              >
                Today
              </Button>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => {
                  if (value) setViewParam(value as StudioView);
                }}
                className="hidden lg:flex"
              >
                <ToggleGroupItem value="day" aria-label="Day view">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Week view">
                  Week
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {}}
          autoScroll
        >
          <AnimatePresence mode="wait" initial={false}>
            {isWeekView ? (
              <motion.div
                key="week"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={viewTransition}
              >
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="hidden lg:block space-y-6">
                    <Card>
                      <CardContent className="space-y-3 p-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Browse month</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDayKeyParam(fallbackDayKey)}
                          >
                            Today
                          </Button>
                        </div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setDayKeyParam(
                                getZonedDayKey(date, placeTimeZone),
                              );
                            }
                          }}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          timeZone={placeTimeZone}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <AnimatePresence mode="wait" initial={false}>
                          {committedRange ? (
                            <motion.div
                              key="week-form"
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: 8 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: -8 }
                              }
                              transition={{
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94],
                              }}
                              className="space-y-4"
                            >
                              <div className="space-y-1">
                                <h3 className="text-sm font-heading font-semibold">
                                  Create Block
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {selectedTimeLabel} · {placeTimeZone}
                                </p>
                              </div>
                              <SelectionPanelForm
                                blockType={selectionBlockType}
                                onBlockTypeChange={setSelectionBlockType}
                                guestModeState={guestModeState}
                                organizationId={organization?.id ?? ""}
                                onGuestModeChange={(mode) => {
                                  setGuestMode(mode);
                                  setGuestModeState(mode);
                                }}
                                onGuestNameChange={setGuestName}
                                onGuestPhoneChange={setGuestPhone}
                                onGuestEmailChange={setGuestEmail}
                                onGuestProfileIdChange={setGuestProfileId}
                                onNotesChange={setNotes}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSelectionSubmit}
                                  className="flex-1"
                                  disabled={isCreatingBlock}
                                >
                                  {isCreatingBlock
                                    ? "Saving..."
                                    : selectionBlockType === "WALK_IN"
                                      ? "Save walk-in"
                                      : selectionBlockType === "MAINTENANCE"
                                        ? "Save maintenance"
                                        : "Save guest booking"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => resetSelectionPanel()}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="week-empty"
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: 8 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: -8 }
                              }
                              transition={{
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94],
                              }}
                              className="space-y-4"
                            >
                              <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <MousePointerClick className="size-4 text-primary/60" />
                                  <h3 className="text-sm font-heading font-semibold">
                                    Create Block
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Click a start time, then an end time on the
                                  timeline to select a range.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={openCustomDialog}
                                disabled={!courtId}
                                className="w-full justify-start"
                              >
                                Custom block...
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {isImportOverlay ? (
                          <div className="space-y-3 pt-2">
                            <Separator />
                            <div className="space-y-1">
                              <h4 className="text-sm font-heading font-semibold">
                                Imported Drafts
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Drag draft rows onto the grid to fix times.
                              </p>
                            </div>
                            {rowsQuery.isLoading ? (
                              <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                              </div>
                            ) : draftRowsSorted.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No draft rows yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {draftRowsSorted.slice(0, 8).map((row) => (
                                  <DraftRowCard
                                    key={row.id}
                                    row={row}
                                    timeZone={placeTimeZone}
                                    disabled={isDraftDragDisabled}
                                    selectedCourt={selectedCourt?.label ?? null}
                                  />
                                ))}
                                {draftRowsSorted.length > 8 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Showing first 8 rows.
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateWeek(-1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h2 className="text-lg font-heading font-semibold">
                            {weekLabel}
                          </h2>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateWeek(1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline">Snap: 60m</Badge>
                      </div>

                      {!placeId || !courtId ? (
                        <Alert>
                          <AlertTitle>Select a venue and court</AlertTitle>
                          <AlertDescription>
                            Choose a venue and court to load the week grid.
                          </AlertDescription>
                        </Alert>
                      ) : blocksQuery.error ? (
                        <Alert variant="destructive">
                          <AlertTitle>Failed to load blocks</AlertTitle>
                          <AlertDescription>
                            {getClientErrorMessage(
                              blocksQuery.error,
                              "Please try again.",
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="relative overflow-x-auto">
                          <div
                            className="grid gap-x-0"
                            style={{
                              gridTemplateColumns:
                                "72px repeat(7, minmax(100px, 1fr))",
                            }}
                          >
                            <div />
                            {weekDayKeys.map((wdk) => {
                              const wdStart = getZonedDayRangeFromDayKey(
                                wdk,
                                placeTimeZone,
                              ).start;
                              const isToday = wdk === todayDayKey;
                              const isPastDay = wdk < todayDayKey;
                              const isSelectedDay = wdk === dayKey;
                              return (
                                <button
                                  key={`header-${wdk}`}
                                  type="button"
                                  className={cn(
                                    "border-b px-1 py-2 text-center text-xs font-semibold transition-colors",
                                    isToday && "text-primary",
                                    isSelectedDay && "bg-primary/5",
                                    isPastDay && "text-muted-foreground/60",
                                  )}
                                  onClick={() => {
                                    setDayKeyParam(wdk);
                                    setViewParam("day");
                                  }}
                                >
                                  <div>
                                    {formatInTimeZone(
                                      wdStart,
                                      placeTimeZone,
                                      "EEE",
                                    )}
                                  </div>
                                  <div
                                    className={cn(
                                      "mt-0.5 text-lg",
                                      isToday &&
                                        "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground",
                                    )}
                                  >
                                    {formatInTimeZone(
                                      wdStart,
                                      placeTimeZone,
                                      "d",
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div
                            className="grid gap-x-0"
                            style={{
                              gridTemplateColumns:
                                "72px repeat(7, minmax(100px, 1fr))",
                            }}
                          >
                            <div>
                              {hours.map((hour) => (
                                <div
                                  key={`week-label-${hour}`}
                                  className="flex h-[56px] items-start pt-2 text-xs text-muted-foreground"
                                >
                                  {formatInTimeZone(
                                    buildDateFromDayKey(
                                      dayKey,
                                      hour * 60,
                                      placeTimeZone,
                                    ),
                                    placeTimeZone,
                                    "h a",
                                  )}
                                </div>
                              ))}
                            </div>

                            {weekDayKeys.map((wdk) => (
                              <WeekDayColumn
                                key={`week-col-${wdk}`}
                                dayKey={wdk}
                                hours={hours}
                                blocks={
                                  weekTimelineBlocksByDayKey.get(wdk) ?? []
                                }
                                draftBlocks={
                                  draftWeekTimelineBlocksByDayKey.get(wdk) ?? []
                                }
                                reservations={
                                  weekTimelineReservationsByDayKey.get(wdk) ??
                                  []
                                }
                                timeZone={placeTimeZone}
                                disabled={isDragDisabled}
                                isPastDay={wdk < todayDayKey}
                                pendingBlockIds={pendingBlockIds}
                                onRemoveBlock={handleCancelBlock}
                                committedRange={
                                  weekCommittedDayKey === wdk
                                    ? committedRange
                                    : null
                                }
                                onCommitRange={handleWeekCommitRange}
                              />
                            ))}
                          </div>
                          {blocksQuery.isLoading ? (
                            <div className="absolute inset-0 rounded-lg bg-background/70 backdrop-blur-sm" />
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="day"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={viewTransition}
              >
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
                  <div className="hidden lg:block space-y-6">
                    <Card>
                      <CardContent className="space-y-3 p-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-heading font-semibold">
                            Day Selector
                          </h2>
                          <Badge variant="secondary">{selectedDayLabel}</Badge>
                        </div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setDayKeyParam(
                                getZonedDayKey(date, placeTimeZone),
                              );
                            }
                          }}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          timeZone={placeTimeZone}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <AnimatePresence mode="wait" initial={false}>
                          {committedRange ? (
                            <motion.div
                              key="day-form"
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: 8 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: -8 }
                              }
                              transition={{
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94],
                              }}
                              className="space-y-4"
                            >
                              <div className="space-y-1">
                                <h3 className="text-sm font-heading font-semibold">
                                  Create Block
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {selectedTimeLabel} · {placeTimeZone}
                                </p>
                              </div>
                              <SelectionPanelForm
                                blockType={selectionBlockType}
                                onBlockTypeChange={setSelectionBlockType}
                                guestModeState={guestModeState}
                                organizationId={organization?.id ?? ""}
                                onGuestModeChange={(mode) => {
                                  setGuestMode(mode);
                                  setGuestModeState(mode);
                                }}
                                onGuestNameChange={setGuestName}
                                onGuestPhoneChange={setGuestPhone}
                                onGuestEmailChange={setGuestEmail}
                                onGuestProfileIdChange={setGuestProfileId}
                                onNotesChange={setNotes}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSelectionSubmit}
                                  className="flex-1"
                                  disabled={isCreatingBlock}
                                >
                                  {isCreatingBlock
                                    ? "Saving..."
                                    : selectionBlockType === "WALK_IN"
                                      ? "Save walk-in"
                                      : selectionBlockType === "MAINTENANCE"
                                        ? "Save maintenance"
                                        : "Save guest booking"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => resetSelectionPanel()}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="day-empty"
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: 8 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { opacity: 0, y: -8 }
                              }
                              transition={{
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94],
                              }}
                              className="space-y-4"
                            >
                              <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <MousePointerClick className="size-4 text-primary/60" />
                                  <h3 className="text-sm font-heading font-semibold">
                                    Create Block
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Click a start time, then an end time on the
                                  timeline to select a range.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={openCustomDialog}
                                disabled={!courtId}
                                className="w-full justify-start"
                              >
                                Custom block...
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {isImportOverlay ? (
                          <div className="space-y-3 pt-2">
                            <Separator />
                            <div className="space-y-1">
                              <h4 className="text-sm font-heading font-semibold">
                                Imported Drafts
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Drag draft rows onto the timeline to fix times.
                              </p>
                            </div>
                            {rowsQuery.isLoading ? (
                              <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                              </div>
                            ) : draftRowsSorted.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No draft rows yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {draftRowsSorted.slice(0, 8).map((row) => (
                                  <DraftRowCard
                                    key={row.id}
                                    row={row}
                                    timeZone={placeTimeZone}
                                    disabled={isDraftDragDisabled}
                                    selectedCourt={selectedCourt?.label ?? null}
                                  />
                                ))}
                                {draftRowsSorted.length > 8 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Showing first 8 rows. Open the import review
                                    for full list.
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-4 p-6 pb-6 lg:pb-6">
                      <div className="space-y-3 lg:hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => navigateMonth(-1)}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Popover
                              open={mobileCalendarOpen}
                              onOpenChange={setMobileCalendarOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="gap-1.5 text-sm font-medium"
                                >
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  {weekLabel}
                                  <ChevronDown
                                    className={cn(
                                      "h-3.5 w-3.5 transition-transform",
                                      mobileCalendarOpen && "rotate-180",
                                    )}
                                  />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      setDayKeyParam(
                                        getZonedDayKey(date, placeTimeZone),
                                      );
                                      setMobileCalendarOpen(false);
                                    }
                                  }}
                                  month={calendarMonth}
                                  onMonthChange={setCalendarMonth}
                                  timeZone={placeTimeZone}
                                />
                              </PopoverContent>
                            </Popover>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => navigateMonth(1)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleMobileToday}
                          >
                            Today
                          </Button>
                        </div>
                        <MobileDateStrip
                          selectedDate={selectedDate}
                          onDateSelect={handleMobileDateSelect}
                          timeZone={placeTimeZone}
                          todayDate={todayDate}
                        />
                      </div>

                      <div className="hidden lg:flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-heading font-semibold">
                            Day Timeline
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {selectedDayLabel}
                          </p>
                        </div>
                        <Badge variant="outline">Snap: 60m</Badge>
                      </div>

                      {!placeId || !courtId ? (
                        <Alert>
                          <AlertTitle>Select a venue and court</AlertTitle>
                          <AlertDescription>
                            Choose a venue and court to load the timeline.
                          </AlertDescription>
                        </Alert>
                      ) : blocksQuery.error ? (
                        <Alert variant="destructive">
                          <AlertTitle>Failed to load blocks</AlertTitle>
                          <AlertDescription>
                            {getClientErrorMessage(
                              blocksQuery.error,
                              "Please try again.",
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <RangeSelectionProvider
                          config={daySelectionConfig}
                          committedRange={committedRange}
                        >
                          <div className="relative">
                            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3">
                              <div className="space-y-0">
                                {hours.map((hour) => {
                                  const hourLabel = formatInTimeZone(
                                    buildDateFromDayKey(
                                      dayKey,
                                      hour * 60,
                                      placeTimeZone,
                                    ),
                                    placeTimeZone,
                                    "h a",
                                  );
                                  return (
                                    <div
                                      key={`label-${hour}`}
                                      className="flex h-[56px] items-start pt-2 text-xs text-muted-foreground"
                                    >
                                      {hourLabel}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="relative">
                                <div className="space-y-0">
                                  {hours.map((hour, hourIndex) => (
                                    <SelectableTimelineRow
                                      key={`row-${hour}`}
                                      dayKey={dayKey}
                                      startMinute={hour * 60}
                                      disabled={isDragDisabled}
                                      cellIndex={hourIndex}
                                    />
                                  ))}
                                </div>
                                <div className="pointer-events-none absolute inset-0">
                                  {timelineBlocks.map(
                                    ({ block, topOffset, height }) => (
                                      <TimelineBlockItem
                                        key={block.id}
                                        block={block}
                                        topOffset={topOffset}
                                        height={height}
                                        timeZone={placeTimeZone}
                                        disabled={isDragDisabled}
                                        isPending={pendingBlockIds.has(
                                          block.id,
                                        )}
                                        onRemove={handleCancelBlock}
                                      />
                                    ),
                                  )}
                                  {draftTimelineBlocks.map(
                                    ({ row, topOffset, height }) => (
                                      <DraftTimelineBlock
                                        key={`draft-${row.id}`}
                                        row={row}
                                        topOffset={topOffset}
                                        height={height}
                                        timeZone={placeTimeZone}
                                      />
                                    ),
                                  )}
                                  {timelineReservations.map(
                                    ({ reservation, topOffset, height }) => (
                                      <TimelineReservationItem
                                        key={`res-${reservation.id}`}
                                        reservation={reservation}
                                        topOffset={topOffset}
                                        height={height}
                                        timeZone={placeTimeZone}
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                            {blocksQuery.isLoading ? (
                              <div className="absolute inset-0 rounded-lg bg-background/70 backdrop-blur-sm" />
                            ) : null}
                          </div>
                        </RangeSelectionProvider>
                      )}

                      <div className="lg:hidden">
                        <MobileDayBlocksList
                          blocks={dayBlocks}
                          isLoading={blocksQuery.isLoading}
                          timeZone={placeTimeZone}
                          selectedDayLabel={selectedDayLabel}
                          onRemoveBlock={handleCancelBlock}
                          isCancelPending={cancelBlock.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hidden lg:block">
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-heading font-semibold">
                          Blocks · {selectedDayLabel}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Review and remove blocks for this day.
                        </p>
                      </div>

                      <Separator />

                      {blocksQuery.isLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : dayBlocks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No blocks on this day yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {dayBlocks.map((block) => (
                            <div
                              key={block.id}
                              className="rounded-lg border p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <Badge
                                    variant={
                                      block.type === "WALK_IN"
                                        ? "paid"
                                        : "warning"
                                    }
                                  >
                                    {block.type === "WALK_IN"
                                      ? "Walk-in"
                                      : "Maintenance"}
                                  </Badge>
                                  <p className="text-sm font-medium">
                                    {formatTimeRangeInTimeZone(
                                      block.startTime,
                                      block.endTime,
                                      placeTimeZone,
                                    )}
                                  </p>
                                  {block.reason ? (
                                    <p className="text-xs text-muted-foreground">
                                      {block.reason}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {block.type === "WALK_IN" ? (
                                    <span className="text-sm font-semibold">
                                      {formatCurrency(
                                        block.totalPriceCents,
                                        block.currency,
                                      )}
                                    </span>
                                  ) : null}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancelBlock(block.id)}
                                    disabled={cancelBlock.isPending}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DragOverlay />
        </DndContext>

        <RemoveBlockDialog confirmRemoveBlock={confirmRemoveBlock} />

        <CustomBlockDialog
          customForm={customForm}
          handleCustomSubmit={handleCustomSubmit}
          isCreatingBlock={isCreatingBlock}
          placeTimeZone={placeTimeZone}
        />

        <GuestBookingDialog
          guestBookingForm={guestBookingForm}
          handleGuestBookingSubmit={handleGuestBookingSubmit}
          isSubmitting={
            createGuestBooking.isPending || createGuestProfile.isPending
          }
          guestProfilesData={
            (guestProfilesQuery.data ?? []) as Array<{
              id: string;
              displayName: string;
              phoneNumber: string | null;
            }>
          }
          guestProfilesLoading={guestProfilesQuery.isLoading}
          placeTimeZone={placeTimeZone}
        />

        <MobileCreateBlockDrawer
          handleMobileSubmit={handleSelectionSubmit}
          isCreatingBlock={isCreatingBlock}
          mobileSelectedTimeLabel={selectedTimeLabel}
          placeTimeZone={placeTimeZone}
          organizationId={organization?.id ?? ""}
          onDrawerClose={handleMobileDrawerClose}
        />
      </div>
    </AppShell>
  );
}
