"use client";

import { TZDate } from "@date-fns/tz";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMinutes, addMonths, endOfMonth } from "date-fns";
import debounce from "debounce";
import {
  AlertCircle,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MousePointerClick,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import {
  getReservationEnablement,
  type ReservationEnablementIssueCode,
} from "@/common/reservation-enablement";
import {
  getZonedDate,
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  toUtcISOString,
} from "@/common/time-zone";
import { RangeSelectionProvider } from "@/components/kudos/range-selection";
import { AppShell } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLogout, useSession } from "@/features/auth";
import { MobileDateStrip } from "@/features/discovery/components/mobile-date-strip";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  buildBlocksRange,
  buildDaySelectionConfig,
  buildTimelineBlocksForDay,
  buildTimelineReservationsForDay,
  buildWeekTimelineBlocksByDayKey,
  buildWeekTimelineReservationsByDayKey,
} from "@/features/owner/booking-studio/helpers";
import { useBookingStudioViewState } from "@/features/owner/booking-studio/hooks";
import { ReservationAlertsPanel } from "@/features/owner/components";
import {
  BookingStudioProvider,
  useBookingStudio,
} from "@/features/owner/components/booking-studio/booking-studio-provider";
import { getTimelineRangeForWeek } from "@/features/owner/components/booking-studio/court-hours";
import { CustomBlockDialog } from "@/features/owner/components/booking-studio/custom-block-dialog";
import { GuestBookingDialog } from "@/features/owner/components/booking-studio/guest-booking-dialog";
import { MobileCreateBlockDrawer } from "@/features/owner/components/booking-studio/mobile-create-block-drawer";
import { MobileDayBlocksList } from "@/features/owner/components/booking-studio/mobile-day-blocks-list";
import { MobileSelectionPeekBar } from "@/features/owner/components/booking-studio/mobile-selection-peek-bar";
import { RemoveBlockDialog } from "@/features/owner/components/booking-studio/remove-block-dialog";
import { computeClampedResizeRange } from "@/features/owner/components/booking-studio/resize-helpers";
import { SelectableTimelineRow } from "@/features/owner/components/booking-studio/selectable-timeline-row";
import { SelectionPanelForm } from "@/features/owner/components/booking-studio/selection-panel-form";
import { TimelineBlockItem } from "@/features/owner/components/booking-studio/timeline-block-item";
import { TimelineReservationItem } from "@/features/owner/components/booking-studio/timeline-reservation-item";
import {
  buildDateFromDayKey,
  type CourtBlockItem,
  type CustomBlockFormValues,
  customBlockSchema,
  formatDateTimeInput,
  type GuestBookingFormValues,
  generateOptimisticId,
  guestBookingFormSchema,
  isOptimisticBlockId,
  parseDateTimeInput,
  parseTimelineRange,
  type ReservationItem,
  type StudioView,
  TIMELINE_ROW_HEIGHT,
} from "@/features/owner/components/booking-studio/types";
import { WeekDayColumn } from "@/features/owner/components/booking-studio/week-day-column";
import {
  useCourtHours,
  useCourtRateRules,
  useOwnerOrganization,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export default function OwnerCourtAvailabilityPage() {
  return (
    <BookingStudioProvider initialDate={new Date()}>
      <OwnerCourtAvailabilityInner />
    </BookingStudioProvider>
  );
}

function OwnerCourtAvailabilityInner() {
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

  const placeTimeZone = placeData?.place.timeZone ?? "Asia/Manila";
  const {
    dayKey,
    setDayKeyParam,
    view,
    setViewParam,
    isWeekView,
    isMobile,
    selectedDayStart,
    selectedDate,
    selectedDayLabel,
    weekDayKeys,
    weekLabel,
    todayDate,
    todayDayKey,
    visibleDayKeys,
    handleMobileDateSelect,
    handleMobileToday,
    navigateWeek,
  } = useBookingStudioViewState({ timeZone: placeTimeZone });

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

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedGuestSearch(guestSearch), 300);
    return () => clearTimeout(timer);
  }, [guestSearch, setDebouncedGuestSearch]);

  // Timeline range from court hours
  const courtHoursQuery = useCourtHours(courtId);
  const courtRateRulesQuery = useCourtRateRules(courtId);
  const dayOfWeek = getZonedDate(selectedDayStart, placeTimeZone).getDay();
  const selectedTimelineRange = React.useMemo(
    () => parseTimelineRange(courtHoursQuery.data ?? [], dayOfWeek),
    [courtHoursQuery.data, dayOfWeek],
  );
  const timelineRange = React.useMemo(() => {
    if (!isWeekView) return selectedTimelineRange;
    return getTimelineRangeForWeek(
      courtHoursQuery.data ?? [],
      weekDayKeys,
      placeTimeZone,
    );
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
  const dayHourLabels = React.useMemo(
    () =>
      hours.map((hour) =>
        formatInTimeZone(
          buildDateFromDayKey(dayKey, hour * 60, placeTimeZone),
          placeTimeZone,
          "h a",
        ),
      ),
    [dayKey, hours, placeTimeZone],
  );

  const timelineStartMinute = startHour * 60;
  const timelineEndMinute = endHour * 60;

  // Data fetching — range covers visible days (day or week)
  const blocksRange = React.useMemo(
    () =>
      buildBlocksRange({
        dayKey,
        visibleDayKeys,
        timeZone: placeTimeZone,
      }),
    [dayKey, placeTimeZone, visibleDayKeys],
  );

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
  const activeBlocksById = React.useMemo(
    () => new Map(activeBlocks.map((block) => [block.id, block])),
    [activeBlocks],
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

  // Day view timeline items
  const timelineBlocks = React.useMemo(
    () =>
      buildTimelineBlocksForDay({
        blocks: activeBlocksForSelectedDay,
        dayKey,
        dayStart: selectedDayStart,
        timeZone: placeTimeZone,
        timelineStartMinute,
        timelineEndMinute,
      }),
    [
      activeBlocksForSelectedDay,
      dayKey,
      placeTimeZone,
      selectedDayStart,
      timelineEndMinute,
      timelineStartMinute,
    ],
  );

  const timelineReservations = React.useMemo(
    () =>
      buildTimelineReservationsForDay({
        reservations: activeReservations,
        dayKey,
        dayStart: selectedDayStart,
        timeZone: placeTimeZone,
        timelineStartMinute,
        timelineEndMinute,
      }),
    [
      activeReservations,
      dayKey,
      placeTimeZone,
      selectedDayStart,
      timelineEndMinute,
      timelineStartMinute,
    ],
  );

  // Week view timeline items (blocks mapped by day key)
  const weekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map();
    }
    return buildWeekTimelineBlocksByDayKey({
      blocks: activeBlocks,
      weekDayKeys,
      timeZone: placeTimeZone,
      timelineStartMinute,
      timelineEndMinute,
    });
  }, [
    activeBlocks,
    isWeekView,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
    weekDayKeys,
  ]);

  const weekTimelineReservationsByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map();
    }
    return buildWeekTimelineReservationsByDayKey({
      reservations: activeReservations,
      weekDayKeys,
      timeZone: placeTimeZone,
      timelineStartMinute,
      timelineEndMinute,
    });
  }, [
    activeReservations,
    isWeekView,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
    weekDayKeys,
  ]);

  // Mutations
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

  // --- Block range resize (optimistic + debounced) ---
  const pendingRangeUpdates = React.useRef<
    Map<string, { startTime: string; endTime: string; version: number }>
  >(new Map());
  const rangeUpdateVersions = React.useRef<Map<string, number>>(new Map());
  const debouncedFlushByBlock = React.useRef<
    Map<string, ReturnType<typeof debounce>>
  >(new Map());

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
          const filtered = existing.filter((b) => b.id !== blockId);
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

  React.useEffect(
    () => () => {
      for (const debounced of debouncedFlushByBlock.current.values()) {
        debounced.clear();
      }
    },
    [],
  );

  const computeNextResizeRange = React.useCallback(
    (args: {
      blockId: string;
      edge: "start" | "end";
      hoursDelta: number;
      baseStart: Date;
      baseEnd: Date;
    }) => {
      const block = activeBlocksById.get(args.blockId);
      if (!block) return null;
      if (block.type !== "WALK_IN" && block.type !== "MAINTENANCE") return null;

      return computeClampedResizeRange({
        block,
        edge: args.edge,
        hoursDelta: args.hoursDelta,
        baseStart: args.baseStart,
        baseEnd: args.baseEnd,
        timeZone: placeTimeZone,
        courtHoursWindows: courtHoursQuery.data ?? [],
        blocks: activeBlocks,
        reservations: activeReservations,
      });
    },
    [
      activeBlocks,
      activeBlocksById,
      activeReservations,
      courtHoursQuery.data,
      placeTimeZone,
    ],
  );

  const handleResizePreview = React.useCallback(
    (args: {
      blockId: string;
      edge: "start" | "end";
      hoursDelta: number;
      baseStart: Date;
      baseEnd: Date;
    }) => {
      const next = computeNextResizeRange(args);
      if (!next) return;

      const nextStartIso = toUtcISOString(next.startTime);
      const nextEndIso = toUtcISOString(next.endTime);

      utils.courtBlock.listForCourtRange.setData(blocksQueryInput, (old) =>
        old?.map((b) =>
          b.id === args.blockId
            ? { ...b, startTime: nextStartIso, endTime: nextEndIso }
            : b,
        ),
      );
    },
    [blocksQueryInput, computeNextResizeRange, utils],
  );

  const handleResizeCommit = React.useCallback(
    (args: {
      blockId: string;
      edge: "start" | "end";
      hoursDelta: number;
      baseStart: Date;
      baseEnd: Date;
    }) => {
      const next = computeNextResizeRange(args);
      if (!next) return;

      const nextStartIso = toUtcISOString(next.startTime);
      const nextEndIso = toUtcISOString(next.endTime);

      const nextVersion =
        (rangeUpdateVersions.current.get(args.blockId) ?? 0) + 1;
      rangeUpdateVersions.current.set(args.blockId, nextVersion);
      pendingRangeUpdates.current.set(args.blockId, {
        startTime: nextStartIso,
        endTime: nextEndIso,
        version: nextVersion,
      });

      utils.courtBlock.listForCourtRange.setData(blocksQueryInput, (old) =>
        old?.map((b) =>
          b.id === args.blockId
            ? { ...b, startTime: nextStartIso, endTime: nextEndIso }
            : b,
        ),
      );

      scheduleRangeFlush(args.blockId);
    },
    [blocksQueryInput, computeNextResizeRange, scheduleRangeFlush, utils],
  );

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
      }
    },
    onSuccess(serverBlock, _variables, context) {
      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) =>
          old?.map((block) =>
            block.id === context?.optimisticId ? serverBlock : block,
          ) ?? [serverBlock],
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
      }
    },
    onSuccess(serverBlock, _variables, context) {
      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) =>
          old?.map((block) =>
            block.id === context?.optimisticId ? serverBlock : block,
          ) ?? [serverBlock],
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

  // Week committed range tracking
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

  const committedDayKey = isWeekView ? (weekCommittedDayKey ?? dayKey) : dayKey;

  // Range selection config (day view only)
  const daySelectionConfig = React.useMemo(
    () =>
      buildDaySelectionConfig({
        timelineBlocks,
        timelineReservations,
        placeTimeZone,
        startHour,
        hours,
        dayOfWeek,
        courtHours: courtHoursQuery.data ?? [],
        onCommitRange: (startIdx, endIdx) => {
          setCommittedRange({ startIdx, endIdx });
        },
      }),
    [
      hours,
      placeTimeZone,
      setCommittedRange,
      startHour,
      timelineBlocks,
      timelineReservations,
      courtHoursQuery.data,
      dayOfWeek,
    ],
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

  const shouldReduceMotion = useReducedMotion();
  const viewTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  // Custom block dialog
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
      committedDayKey,
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
    committedDayKey,
    customForm,
    placeTimeZone,
    setCustomDialogOpen,
    timelineStartMinute,
  ]);

  const handleCustomSubmit = React.useCallback(
    async (values: CustomBlockFormValues) => {
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

  // Submit handler for selection panel — read store refs at call time
  const guestModeRef = React.useRef<"new" | "existing">("existing");
  const guestNameRef = React.useRef("");
  const guestPhoneRef = React.useRef("");
  const guestEmailRef = React.useRef("");
  const guestProfileIdRef = React.useRef("");
  const notesRef = React.useRef("");

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

  const isCreatingBlock =
    createMaintenance.isPending ||
    createWalkIn.isPending ||
    createGuestBooking.isPending;

  const handleSelectionSubmit = React.useCallback(async () => {
    if (!committedRange) {
      toast.error("Select a time range first");
      return;
    }
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
    setWeekCommittedDayKey(null);
  }, [
    committedDayKey,
    committedRange,
    courtId,
    createGuestBooking,
    createGuestProfile,
    createMaintenance,
    createWalkIn,
    selectionBlockType,
    organization?.id,
    placeTimeZone,
    resetSelectionPanel,
    startHour,
  ]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.availability(placeId, courtId),
    );
  };

  const scheduleHref = appRoutes.owner.places.courts.schedule(placeId, courtId);
  const reservationsHref = `${appRoutes.owner.reservations}?placeId=${placeId}&courtId=${courtId}`;

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

  const verificationHref = appRoutes.owner.verification.place(placeId);
  const verificationStatus = placeData.verification?.status ?? "UNVERIFIED";
  const reservationsEnabled =
    placeData.verification?.reservationsEnabled ?? false;
  const hasHoursWindows = courtHoursQuery.data
    ? courtHoursQuery.data.length > 0
    : null;
  const hasRateRules = courtRateRulesQuery.data
    ? courtRateRulesQuery.data.length > 0
    : null;
  const enablement = getReservationEnablement({
    placeType: placeData.place.placeType,
    verificationStatus,
    reservationsEnabled,
    hasHoursWindows,
    hasRateRules,
  });
  const hasIssue = (code: ReservationEnablementIssueCode) =>
    enablement.issues.some((issue) => issue.code === code);
  const showVerificationBanner =
    hasIssue("VERIFICATION_REQUIRED") ||
    hasIssue("VERIFICATION_PENDING") ||
    hasIssue("VERIFICATION_REJECTED");
  const showReservationsDisabledBanner = hasIssue("RESERVATIONS_DISABLED");
  const showScheduleBanner = hasIssue("NO_SCHEDULE");
  const showPricingBanner = hasIssue("NO_PRICING");

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
        <PageHeader
          title="Availability"
          description={courtData.court.label}
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Availability" },
          ]}
          breadcrumbClassName="hidden sm:block"
          backHref={appRoutes.owner.places.courts.base(placeId)}
          actions={
            <>
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
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={scheduleHref}>Edit schedule</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={reservationsHref}>View bookings</Link>
              </Button>
            </>
          }
          actionsClassName="flex-col sm:flex-row w-full sm:w-auto"
        />

        {(showVerificationBanner ||
          showReservationsDisabledBanner ||
          showScheduleBanner ||
          showPricingBanner) && (
          <div className="space-y-3">
            {showVerificationBanner && (
              <Alert className="border-warning/20 bg-warning/10">
                <AlertCircle className="text-warning" />
                <AlertTitle>Venue not yet verified</AlertTitle>
                <AlertDescription>
                  <p>
                    Verification status: {verificationStatus.toLowerCase()}.
                    Public bookings won&apos;t be available until this venue is
                    verified.
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href={verificationHref}>Go to verification</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {showReservationsDisabledBanner && (
              <Alert className="border-warning/20 bg-warning/10">
                <AlertCircle className="text-warning" />
                <AlertTitle>Reservations are disabled</AlertTitle>
                <AlertDescription>
                  <p>
                    Players cannot book online until reservations are enabled.
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href={verificationHref}>Enable reservations</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {showScheduleBanner && (
              <Alert className="border-warning/20 bg-warning/10">
                <AlertCircle className="text-warning" />
                <AlertTitle>No schedule hours configured</AlertTitle>
                <AlertDescription>
                  <p>
                    You haven&apos;t set up operating hours for this court yet.
                    Add schedule hours to enable availability.
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href={scheduleHref}>Edit schedule & pricing</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {showPricingBanner && (
              <Alert className="border-warning/20 bg-warning/10">
                <AlertCircle className="text-warning" />
                <AlertTitle>No pricing rules configured</AlertTitle>
                <AlertDescription>
                  <p>
                    You haven&apos;t set up pricing rules for this court yet.
                    Add pricing to enable bookings.
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href={scheduleHref}>Edit schedule & pricing</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

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
                {/* Left sidebar — calendar + create block panel */}
                <div className="hidden lg:block space-y-6">
                  <Card>
                    <CardContent className="space-y-3 p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-heading font-semibold">
                          Week Selector
                        </h2>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleMobileToday}
                        >
                          Today
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setDayKeyParam(getZonedDayKey(date, placeTimeZone));
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
                                onClick={() => {
                                  resetSelectionPanel();
                                  setWeekCommittedDayKey(null);
                                }}
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
                                Click a start time, then an end time on any day
                                column to select a range.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={openCustomDialog}
                              className="w-full justify-start"
                            >
                              Custom block...
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>

                {/* Week timeline */}
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

                    {blocksQuery.error ? (
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
                              blocks={weekTimelineBlocksByDayKey.get(wdk) ?? []}
                              draftBlocks={[]}
                              reservations={
                                weekTimelineReservationsByDayKey.get(wdk) ?? []
                              }
                              timeZone={placeTimeZone}
                              disabled={false}
                              isPastDay={wdk < todayDayKey}
                              courtHoursWindows={courtHoursQuery.data ?? []}
                              pendingBlockIds={pendingBlockIds}
                              onRemoveBlock={handleCancelBlock}
                              onResizePreview={(args) => {
                                if (pendingBlockIds.has(args.blockId)) return;
                                if (isOptimisticBlockId(args.blockId)) return;
                                handleResizePreview(args);
                              }}
                              onResizeCommit={(args) => {
                                if (pendingBlockIds.has(args.blockId)) return;
                                if (isOptimisticBlockId(args.blockId)) return;
                                handleResizeCommit(args);
                              }}
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
                {/* Left sidebar — calendar + create block panel */}
                <div className="hidden lg:block space-y-6">
                  <Card>
                    <CardContent className="space-y-3 p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-heading font-semibold">
                          Day Selector
                        </h2>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleMobileToday}
                        >
                          Today
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setDayKeyParam(getZonedDayKey(date, placeTimeZone));
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
                              className="w-full justify-start"
                            >
                              Custom block...
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>

                {/* Center — timeline */}
                <Card>
                  <CardContent className="space-y-4 p-6 pb-6 lg:pb-6">
                    {/* Mobile header */}
                    <div className="space-y-3 lg:hidden">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0">
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
                                className="gap-1.5 text-sm font-medium min-w-0"
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span className="truncate">{weekLabel}</span>
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
                          className="shrink-0"
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

                    {/* Desktop header */}
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

                    {blocksQuery.error ? (
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
                          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-[72px_minmax(0,1fr)]">
                            <div className="hidden space-y-0 md:block">
                              {dayHourLabels.map((hourLabel, index) => (
                                <div
                                  key={`label-${hours[index] ?? index}`}
                                  className="flex h-[56px] items-start pt-2 text-xs text-muted-foreground"
                                >
                                  {hourLabel}
                                </div>
                              ))}
                            </div>

                            <div className="relative">
                              <div className="space-y-0">
                                {hours.map((hour, hourIndex) => (
                                  <SelectableTimelineRow
                                    key={`row-${hour}`}
                                    dayKey={dayKey}
                                    startMinute={hour * 60}
                                    disabled={false}
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
                                      disabled={false}
                                      isPending={pendingBlockIds.has(block.id)}
                                      onRemove={handleCancelBlock}
                                      onResizePreview={
                                        (block.type === "WALK_IN" ||
                                          block.type === "MAINTENANCE") &&
                                        !pendingBlockIds.has(block.id) &&
                                        !isOptimisticBlockId(block.id)
                                          ? handleResizePreview
                                          : undefined
                                      }
                                      onResizeCommit={
                                        (block.type === "WALK_IN" ||
                                          block.type === "MAINTENANCE") &&
                                        !pendingBlockIds.has(block.id) &&
                                        !isOptimisticBlockId(block.id)
                                          ? handleResizeCommit
                                          : undefined
                                      }
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
                                      compact={
                                        height <= TIMELINE_ROW_HEIGHT + 8
                                      }
                                      onClick={() => {
                                        router.push(
                                          appRoutes.owner.reservationDetail(
                                            reservation.id,
                                          ),
                                        );
                                      }}
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

                    {/* Mobile blocks list */}
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

                {/* Right sidebar — blocks list */}
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
                          <div key={block.id} className="rounded-lg border p-3">
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

        {isMobile && (
          <MobileSelectionPeekBar
            selectedTimeLabel={selectedTimeLabel}
            onOpen={() => setMobileDrawerOpen(true)}
          />
        )}
      </div>
    </AppShell>
  );
}
