"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMinutes, differenceInMinutes } from "date-fns";
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
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { DEFAULT_TIME_ZONE } from "@/common/location-defaults";
import {
  getZonedDate,
  getZonedDayRangeFromDayKey,
  toUtcISOString,
} from "@/common/time-zone";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { MobileDateStrip } from "@/components/kudos/mobile-date-strip";
import { RangeSelectionProvider } from "@/components/kudos/range-selection";
import { AppShell } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner";
import {
  buildBlocksRange,
  buildDaySelectionConfig,
  buildDraftRowsState,
  buildDraftTimelineBlocksForDay,
  buildDraftWeekTimelineBlocksByDayKey,
  buildTimelineBlocksForDay,
  buildTimelineReservationsForDay,
  buildWeekTimelineBlocksByDayKey,
  buildWeekTimelineReservationsByDayKey,
  getBlockCtaLabel,
} from "@/features/owner/booking-studio/helpers";
import { useBookingStudioViewState } from "@/features/owner/booking-studio/hooks";
import { AvailabilityStudioLoadingShell } from "@/features/owner/components/availability-studio/availability-studio-loading-shell";
import { AvailabilityStudioToolbar } from "@/features/owner/components/availability-studio/availability-studio-toolbar";
import {
  BookingStudioProvider,
  useBookingStudio,
} from "@/features/owner/components/booking-studio/booking-studio-provider";
import {
  getOperatingHoursForDay,
  getOperatingHoursForWeek,
} from "@/features/owner/components/booking-studio/court-hours";
import { CustomBlockDialog } from "@/features/owner/components/booking-studio/custom-block-dialog";
import {
  DraftRowCard,
  DraftTimelineBlock,
} from "@/features/owner/components/booking-studio/draft-row-card";
import { GuestBookingDialog } from "@/features/owner/components/booking-studio/guest-booking-dialog";
import { ManageBlockDialog } from "@/features/owner/components/booking-studio/manage-block-dialog";
import { MobileCreateBlockDrawer } from "@/features/owner/components/booking-studio/mobile-create-block-drawer";
import { MobileDayBlocksList } from "@/features/owner/components/booking-studio/mobile-day-blocks-list";
import { MobileManageBlockPeekBar } from "@/features/owner/components/booking-studio/mobile-manage-block-peek-bar";
import { MobileSelectionPeekBar } from "@/features/owner/components/booking-studio/mobile-selection-peek-bar";
import { RemoveBlockDialog } from "@/features/owner/components/booking-studio/remove-block-dialog";
import { ReplaceWithGuestDialog } from "@/features/owner/components/booking-studio/replace-with-guest-dialog";
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
  type DraftRowItem,
  formatDateTimeInput,
  type GuestBookingFormValues,
  generateOptimisticId,
  guestBookingFormSchema,
  isOptimisticBlockId,
  parseDateTimeInput,
  type ReservationItem,
} from "@/features/owner/components/booking-studio/types";
import { useIs2xlUp } from "@/features/owner/components/booking-studio/use-is-2xl-up";
import { useManageBlock } from "@/features/owner/components/booking-studio/use-manage-block";
import { WeekDayColumn } from "@/features/owner/components/booking-studio/week-day-column";
import {
  useModCourtHours,
  useModOwnerCourtFilter,
  useModOwnerCourtStudioTransport,
  useModOwnerInvalidation,
  useModOwnerPlaceFilter,
  useMutOwnerConvertWalkInBlockToGuest,
  useMutOwnerCourtBlockCancel,
  useMutOwnerCourtBlockCreateMaintenance,
  useMutOwnerCourtBlockCreateWalkIn,
  useMutOwnerCourtBlockUpdateRange,
  useMutOwnerCreateGuestBooking,
  useMutOwnerGuestProfileCreate,
  useMutOwnerImportCommit,
  useMutOwnerImportDiscardJob,
  useMutOwnerImportReplaceWithGuest,
  useMutOwnerImportUpdateRow,
  useQueryOwnerActiveReservationsForCourtRange,
  useQueryOwnerCourtBlocksForRange,
  useQueryOwnerCourtsByPlace,
  useQueryOwnerGuestProfiles,
  useQueryOwnerImportJob,
  useQueryOwnerImportRows,
  useQueryOwnerOrganization,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

export default function OwnerAvailabilityStudioPage() {
  return (
    <BookingStudioProvider initialDate={new Date()}>
      <OwnerAvailabilityStudioInner />
    </BookingStudioProvider>
  );
}

function OwnerAvailabilityStudioInner() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const { placeId, setPlaceId } = useModOwnerPlaceFilter({
    storageKey: "owner.availabilityStudio.placeId",
  });
  const { courtId, setCourtId } = useModOwnerCourtFilter({
    storageKey: "owner.availabilityStudio.courtId",
  });

  const { data: places = [], isLoading: placesLoading } = useQueryOwnerPlaces(
    organization?.id ?? null,
  );
  const { data: courts = [], isLoading: courtsLoading } =
    useQueryOwnerCourtsByPlace(placeId);

  const placeTimeZone = DEFAULT_TIME_ZONE;
  const selectedCourt = React.useMemo(
    () => courts.find((court) => court.id === courtId),
    [courtId, courts],
  );

  const is2xlUp = useIs2xlUp();

  const {
    dayKey,
    setDayKeyParam,
    view,
    setViewParam,
    isWeekView,
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
  } = useBookingStudioViewState({
    timeZone: placeTimeZone,
    forceView: is2xlUp ? undefined : "day",
  });
  const [jobIdParam, setJobIdParam] = useQueryState(
    "jobId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const jobId = jobIdParam ?? "";

  const listRowsQueryInput = React.useMemo(
    () => ({ jobId, limit: 200, offset: 0 }),
    [jobId],
  );

  const jobQuery = useQueryOwnerImportJob(
    { jobId },
    { enabled: Boolean(jobId) },
  );
  const rowsQuery = useQueryOwnerImportRows(listRowsQueryInput, {
    enabled: Boolean(jobId),
  });

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
  const draftRows = (rowsQuery.data ?? []) as DraftRowItem[];
  const {
    draftRowsById,
    draftRowsByBlockId,
    draftRowsSorted,
    importedBlockIds,
    replacedBlockIds,
    isImportEditable,
    canCommitImport,
    isImportCommitted,
  } = React.useMemo(
    () => buildDraftRowsState({ draftRows, isImportOverlay, job }),
    [draftRows, isImportOverlay, job],
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
  const replaceDialogOpen = useBookingStudio((s) => s.replaceDialogOpen);
  const replaceBlockId = useBookingStudio((s) => s.replaceBlockId);
  const openReplaceDialog = useBookingStudio((s) => s.openReplaceDialog);
  const closeReplaceDialog = useBookingStudio((s) => s.closeReplaceDialog);
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
    const timer = setTimeout(() => setDebouncedGuestSearch(guestSearch), 2000);
    return () => clearTimeout(timer);
  }, [guestSearch, setDebouncedGuestSearch]);

  const courtHoursQuery = useModCourtHours(courtId);
  const dayOfWeek = getZonedDate(selectedDayStart, placeTimeZone).getDay();

  const hours = React.useMemo(() => {
    const windows = courtHoursQuery.data ?? [];
    if (!isWeekView) return getOperatingHoursForDay(windows, dayOfWeek);
    return getOperatingHoursForWeek(windows, weekDayKeys, placeTimeZone);
  }, [courtHoursQuery.data, dayOfWeek, isWeekView, weekDayKeys, placeTimeZone]);

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

  const blocksQuery = useQueryOwnerCourtBlocksForRange(blocksQueryInput, {
    enabled: Boolean(courtId),
  });

  const reservationsQueryInput = React.useMemo(
    () => ({
      courtId,
      startTime: blocksRangeStartIso,
      endTime: blocksRangeEndIso,
    }),
    [courtId, blocksRangeStartIso, blocksRangeEndIso],
  );

  const reservationsQuery = useQueryOwnerActiveReservationsForCourtRange(
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

  const timelineBlocks = React.useMemo(
    () =>
      buildTimelineBlocksForDay({
        blocks: activeBlocksForSelectedDay,
        dayKey,
        dayStart: selectedDayStart,
        timeZone: placeTimeZone,
        hours,
      }),
    [
      activeBlocksForSelectedDay,
      dayKey,
      placeTimeZone,
      selectedDayStart,
      hours,
    ],
  );

  const weekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map();
    }
    return buildWeekTimelineBlocksByDayKey({
      blocks: activeBlocks,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
    });
  }, [activeBlocks, isWeekView, placeTimeZone, hours, weekDayKeys]);

  const timelineReservations = React.useMemo(
    () =>
      buildTimelineReservationsForDay({
        reservations: activeReservations,
        dayKey,
        dayStart: selectedDayStart,
        timeZone: placeTimeZone,
        hours,
      }),
    [activeReservations, dayKey, placeTimeZone, selectedDayStart, hours],
  );

  const weekTimelineReservationsByDayKey = React.useMemo(() => {
    if (!isWeekView) {
      return new Map();
    }
    return buildWeekTimelineReservationsByDayKey({
      reservations: activeReservations,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
    });
  }, [activeReservations, isWeekView, placeTimeZone, hours, weekDayKeys]);

  const draftTimelineBlocks = React.useMemo(
    () =>
      isImportOverlay
        ? buildDraftTimelineBlocksForDay({
            draftRows,
            dayKey,
            dayStart: selectedDayStart,
            timeZone: placeTimeZone,
            hours,
            courtId,
          })
        : [],
    [
      courtId,
      dayKey,
      draftRows,
      isImportOverlay,
      placeTimeZone,
      selectedDayStart,
      hours,
    ],
  );

  const draftWeekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isImportOverlay || !isWeekView) {
      return new Map();
    }
    return buildDraftWeekTimelineBlocksByDayKey({
      draftRows,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      courtId,
    });
  }, [
    courtId,
    draftRows,
    isImportOverlay,
    isWeekView,
    placeTimeZone,
    hours,
    weekDayKeys,
  ]);

  const utils = useModOwnerCourtStudioTransport();
  const {
    invalidateActiveReservationsForCourtRange,
    invalidateCourtBlocksRange,
    invalidateImportRows,
    invalidateImportRowsAndJob,
  } = useModOwnerInvalidation();
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

  const createMaintenance = useMutOwnerCourtBlockCreateMaintenance({
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
      void invalidateCourtBlocksRange(blocksQueryInput);
    },
  });

  const createWalkIn = useMutOwnerCourtBlockCreateWalkIn({
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
      void invalidateCourtBlocksRange(blocksQueryInput);
    },
  });

  const cancelBlock = useMutOwnerCourtBlockCancel({
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
      void invalidateCourtBlocksRange(blocksQueryInput);
    },
  });

  const updateRange = useMutOwnerCourtBlockUpdateRange();

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
          void invalidateCourtBlocksRange(blocksQueryInput);
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
      invalidateCourtBlocksRange,
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

  const draftRowsQueryInput = listRowsQueryInput;

  const updateDraftRow = useMutOwnerImportUpdateRow({
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
        void invalidateImportRowsAndJob(draftRowsQueryInput, { jobId });
      }
    },
  });

  const commitImport = useMutOwnerImportCommit();
  const discardImport = useMutOwnerImportDiscardJob();

  const invalidateDraftRows = React.useCallback(() => {
    if (!jobId) return;
    void invalidateImportRowsAndJob(draftRowsQueryInput, { jobId });
  }, [draftRowsQueryInput, invalidateImportRowsAndJob, jobId]);

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

  const guestProfilesQuery = useQueryOwnerGuestProfiles(
    {
      organizationId: organization?.id ?? "",
      query: debouncedGuestSearch || undefined,
      limit: 50,
    },
    { enabled: (guestBookingOpen || replaceDialogOpen) && !!organization?.id },
  );
  const createGuestProfile = useMutOwnerGuestProfileCreate();
  const createGuestBooking = useMutOwnerCreateGuestBooking({
    onSettled() {
      void invalidateCourtBlocksRange(blocksQueryInput);
      void invalidateActiveReservationsForCourtRange(reservationsQueryInput);
    },
  });

  const isSubmittingGuestBookingRef = React.useRef(false);
  const handleGuestBookingSubmit = React.useCallback(
    async (values: GuestBookingFormValues) => {
      if (isSubmittingGuestBookingRef.current) return;
      isSubmittingGuestBookingRef.current = true;
      try {
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
      } finally {
        isSubmittingGuestBookingRef.current = false;
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

  // --- Replace imported block with guest booking ---
  const replaceWithGuestForm = useForm<GuestBookingFormValues>({
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

  const replaceRow = replaceBlockId
    ? draftRowsByBlockId.get(replaceBlockId)
    : null;
  const replaceBlock = React.useMemo(() => {
    if (!replaceBlockId) return null;
    return activeBlocks.find((block) => block.id === replaceBlockId) ?? null;
  }, [activeBlocks, replaceBlockId]);
  const isWalkInReplace = Boolean(
    replaceBlock && replaceBlock.type === "WALK_IN" && !replaceRow,
  );
  const replaceStartTime =
    replaceRow?.startTime ?? replaceBlock?.startTime ?? null;
  const replaceEndTime = replaceRow?.endTime ?? replaceBlock?.endTime ?? null;
  const replaceSuggestedName =
    replaceRow?.reason ?? replaceBlock?.reason ?? null;

  React.useEffect(() => {
    if (replaceDialogOpen && (replaceRow || replaceBlock)) {
      replaceWithGuestForm.reset({
        startTime: "",
        endTime: "",
        guestMode: "existing",
        guestProfileId: "",
        newGuestName: replaceSuggestedName ?? "",
        newGuestPhone: "",
        newGuestEmail: "",
        notes: "",
      });
    }
  }, [
    replaceDialogOpen,
    replaceRow,
    replaceBlock,
    replaceSuggestedName,
    replaceWithGuestForm,
  ]);

  const replaceWithGuestMutation = useMutOwnerImportReplaceWithGuest({
    onSuccess() {
      toast.success("Block replaced with guest booking");
      closeReplaceDialog();
      void invalidateCourtBlocksRange(blocksQueryInput);
      void invalidateActiveReservationsForCourtRange(reservationsQueryInput);
      void invalidateImportRows(draftRowsQueryInput);
    },
    onError(error) {
      toast.error("Unable to replace block", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });
  const convertWalkInMutation = useMutOwnerConvertWalkInBlockToGuest({
    onSuccess() {
      toast.success("Walk-in converted to guest booking");
      closeReplaceDialog();
      void invalidateCourtBlocksRange(blocksQueryInput);
      void invalidateActiveReservationsForCourtRange(reservationsQueryInput);
    },
    onError(error) {
      toast.error("Unable to convert walk-in", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });

  const isSubmittingReplaceRef = React.useRef(false);
  const handleReplaceWithGuestSubmit = React.useCallback(
    async (values: GuestBookingFormValues) => {
      if (isSubmittingReplaceRef.current) return;
      isSubmittingReplaceRef.current = true;
      try {
        const guestProfileId =
          values.guestMode === "existing"
            ? (values.guestProfileId ?? undefined)
            : undefined;
        const newGuestName =
          values.guestMode === "new"
            ? (values.newGuestName ?? undefined)
            : undefined;
        const newGuestPhone =
          values.guestMode === "new"
            ? (values.newGuestPhone ?? undefined)
            : undefined;
        const newGuestEmail =
          values.guestMode === "new"
            ? (values.newGuestEmail ?? undefined)
            : undefined;

        if (replaceRow) {
          await replaceWithGuestMutation.mutateAsync({
            rowId: replaceRow.id,
            guestMode: values.guestMode,
            guestProfileId,
            newGuestName,
            newGuestPhone,
            newGuestEmail,
            notes: values.notes ?? undefined,
          });
          return;
        }

        if (replaceBlock && replaceBlock.type === "WALK_IN") {
          await convertWalkInMutation.mutateAsync({
            blockId: replaceBlock.id,
            guestMode: values.guestMode,
            guestProfileId,
            newGuestName,
            newGuestPhone,
            newGuestEmail,
            notes: values.notes ?? undefined,
          });
          return;
        }

        toast.error("No valid block found to convert");
      } finally {
        isSubmittingReplaceRef.current = false;
      }
    },
    [convertWalkInMutation, replaceBlock, replaceRow, replaceWithGuestMutation],
  );

  const handleOpenReplaceDialog = React.useCallback(
    (blockId: string) => {
      openReplaceDialog(blockId);
    },
    [openReplaceDialog],
  );

  const manageBlock = useManageBlock({
    activeBlocksById,
    onCancelBlock: handleCancelBlock,
    onOpenReplaceDialog: handleOpenReplaceDialog,
    onSelect: resetSelectionPanel,
  });

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

  // Mobile selection config
  const daySelectionConfig = React.useMemo(
    () =>
      buildDaySelectionConfig({
        timelineBlocks,
        timelineReservations,
        hours,
        dayOfWeek,
        courtHours: courtHoursQuery.data ?? [],
        onCommitRange: (startIdx, endIdx) => {
          setCommittedRange({ startIdx, endIdx });
          manageBlock.close();
        },
      }),
    [
      hours,
      setCommittedRange,
      timelineBlocks,
      timelineReservations,
      courtHoursQuery.data,
      dayOfWeek,
      manageBlock.close,
    ],
  );

  // Track which day column committed the range in week view
  const [weekCommittedDayKey, setWeekCommittedDayKey] = React.useState<
    string | null
  >(null);

  const handleWeekCommitRange = React.useCallback(
    (columnDayKey: string, s: number, e: number) => {
      setCommittedRange({ startIdx: s, endIdx: e });
      setWeekCommittedDayKey(columnDayKey);
      manageBlock.close();
    },
    [setCommittedRange, manageBlock.close],
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

  React.useEffect(() => {
    if (is2xlUp) {
      setMobileDrawerOpen(false);
    }
  }, [is2xlUp, setMobileDrawerOpen]);

  // The effective dayKey for committed range display
  const committedDayKey = isWeekView ? (weekCommittedDayKey ?? dayKey) : dayKey;

  const selectedTimeLabel = React.useMemo(() => {
    if (!committedRange) return "";
    const startHourVal = hours[committedRange.startIdx];
    const endHourVal = hours[committedRange.endIdx];
    if (startHourVal === undefined || endHourVal === undefined) return "";
    const firstHour = hours[0] ?? 0;
    const startMin =
      startHourVal < firstHour ? startHourVal * 60 + 1440 : startHourVal * 60;
    const endMin =
      endHourVal < firstHour
        ? (endHourVal + 1) * 60 + 1440
        : (endHourVal + 1) * 60;
    const s = buildDateFromDayKey(committedDayKey, startMin, placeTimeZone);
    const e = buildDateFromDayKey(committedDayKey, endMin, placeTimeZone);
    return formatTimeRangeInTimeZone(s, e, placeTimeZone);
  }, [committedDayKey, committedRange, hours, placeTimeZone]);

  const shouldReduceMotion = useReducedMotion();
  const viewTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  const [armedDraftRowId, setArmedDraftRowId] = React.useState<string | null>(
    null,
  );
  const isPlacingDraftRow = Boolean(
    armedDraftRowId && isImportOverlay && isImportEditable,
  );

  React.useEffect(() => {
    if (!isImportOverlay) {
      setArmedDraftRowId(null);
    }
  }, [isImportOverlay]);

  const handleArmDraftRow = React.useCallback(
    (rowId: string) => {
      if (!isImportOverlay || !isImportEditable) return;
      setArmedDraftRowId((current) => (current === rowId ? null : rowId));
    },
    [isImportEditable, isImportOverlay],
  );

  const handlePlaceDraftRow = React.useCallback(
    async (placeDayKey: string, placeStartMinute: number) => {
      if (!armedDraftRowId) return;
      const row = draftRowsById.get(armedDraftRowId);
      setArmedDraftRowId(null);
      if (!row) return;
      await handleDraftRowDrop(row.id, placeDayKey, placeStartMinute);
    },
    [armedDraftRowId, draftRowsById, handleDraftRowDrop],
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

      const next = computeClampedResizeRange({
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
      return next;
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

      if (!isOptimisticBlockId(args.blockId)) {
        scheduleRangeFlushRef.current(args.blockId);
      }
    },
    [blocksQueryInput, computeNextResizeRange, utils],
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
      guestMode: "existing",
      guestProfileId: "",
      newGuestName: "",
      newGuestPhone: "",
      newGuestEmail: "",
    },
  });

  const openCustomDialog = React.useCallback(() => {
    const firstHour = hours[0] ?? 6;
    const start = buildDateFromDayKey(dayKey, firstHour * 60, placeTimeZone);
    const end = addMinutes(start, 60);
    customForm.reset({
      blockType: "MAINTENANCE",
      startTime: formatDateTimeInput(start, placeTimeZone),
      endTime: formatDateTimeInput(end, placeTimeZone),
      reason: "",
    });
    setCustomDialogOpen(true);
  }, [customForm, dayKey, hours, placeTimeZone, setCustomDialogOpen]);

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
        if (values.blockType === "GUEST_BOOKING") {
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
            notes: values.reason?.trim() || undefined,
          });

          toast.success("Guest booking added");
        } else {
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
        }

        setCustomDialogOpen(false);
      } catch (error) {
        toast.error("Unable to create block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      courtId,
      createGuestBooking,
      createGuestProfile,
      createMaintenance,
      createWalkIn,
      organization?.id,
      placeTimeZone,
      setCustomDialogOpen,
    ],
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.bookings,
    );
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

  const isSubmittingSelectionRef = React.useRef(false);
  const handleSelectionSubmit = React.useCallback(async () => {
    if (isSubmittingSelectionRef.current) return;
    isSubmittingSelectionRef.current = true;
    try {
      if (!courtId || !committedRange) {
        toast.error("Select a court and time range first");
        return;
      }
      const effectiveDayKey = isWeekView
        ? (weekCommittedDayKey ?? dayKey)
        : dayKey;
      const startHourVal = hours[committedRange.startIdx];
      const endHourVal = hours[committedRange.endIdx];
      if (startHourVal === undefined || endHourVal === undefined) return;
      const firstHour = hours[0] ?? 0;
      const startMin =
        startHourVal < firstHour ? startHourVal * 60 + 1440 : startHourVal * 60;
      const endMin =
        endHourVal < firstHour
          ? (endHourVal + 1) * 60 + 1440
          : (endHourVal + 1) * 60;
      const s = buildDateFromDayKey(effectiveDayKey, startMin, placeTimeZone);
      const e = buildDateFromDayKey(effectiveDayKey, endMin, placeTimeZone);

      if (selectionBlockType === "GUEST_BOOKING") {
        const currentGuestMode = guestModeRef.current;
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
      } else {
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
      }

      resetSelectionPanel();
    } catch (error) {
      const msg =
        selectionBlockType === "GUEST_BOOKING"
          ? "Unable to add guest booking"
          : "Unable to create block";
      toast.error(msg, {
        description: getClientErrorMessage(error, "Please try again"),
      });
    } finally {
      isSubmittingSelectionRef.current = false;
    }
  }, [
    courtId,
    createGuestBooking,
    createGuestProfile,
    createMaintenance,
    createWalkIn,
    dayKey,
    hours,
    isWeekView,
    selectionBlockType,
    committedRange,
    organization?.id,
    placeTimeZone,
    resetSelectionPanel,
    weekCommittedDayKey,
  ]);

  if (orgLoading) {
    return (
      <AvailabilityStudioLoadingShell
        userName={user?.email?.split("@")[0]}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
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
                    <Link
                      href={appRoutes.organization.imports.bookingsReview(
                        jobId,
                      )}
                    >
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

        <AvailabilityStudioToolbar
          placeId={placeId}
          places={places}
          courtId={courtId}
          courts={courts}
          courtsLoading={courtsLoading}
          placeTimeZone={placeTimeZone}
          view={view}
          onPlaceChange={setPlaceId}
          onCourtChange={setCourtId}
          onViewChange={(nextView) => setViewParam(nextView)}
          onToday={handleMobileToday}
        />

        <AnimatePresence mode="wait" initial={false}>
          {is2xlUp && isWeekView ? (
            <motion.div
              key="week"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={viewTransition}
            >
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="hidden 2xl:block space-y-6">
                  <Card>
                    <CardContent className="space-y-3 p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Browse month</p>
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
                          if (date) handleMobileDateSelect(date);
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
                                {getBlockCtaLabel(
                                  selectionBlockType,
                                  isCreatingBlock,
                                )}
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
                              Tap a draft row, then tap a slot to place it.
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
                                  isArmed={row.id === armedDraftRowId}
                                  onArm={handleArmDraftRow}
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
                              blocks={weekTimelineBlocksByDayKey.get(wdk) ?? []}
                              draftBlocks={
                                draftWeekTimelineBlocksByDayKey.get(wdk) ?? []
                              }
                              reservations={
                                weekTimelineReservationsByDayKey.get(wdk) ?? []
                              }
                              timeZone={placeTimeZone}
                              disabled={isDragDisabled}
                              isPastDay={wdk < todayDayKey}
                              courtHoursWindows={courtHoursQuery.data ?? []}
                              pendingBlockIds={pendingBlockIds}
                              onSelectBlock={manageBlock.select}
                              placing={isPlacingDraftRow}
                              onPlace={handlePlaceDraftRow}
                              onResizePreview={handleResizePreview}
                              onResizeCommit={handleResizeCommit}
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
              <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <div className="hidden 2xl:block space-y-6">
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
                            handleMobileDateSelect(date);
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
                                {getBlockCtaLabel(
                                  selectionBlockType,
                                  isCreatingBlock,
                                )}
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
                              Tap a draft row, then tap a slot to place it.
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
                                  isArmed={row.id === armedDraftRowId}
                                  onArm={handleArmDraftRow}
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
                  <CardContent className="space-y-4 p-6 pr-8 pb-6 lg:pr-6 lg:pb-6">
                    <div className="space-y-3 2xl:hidden">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-0 flex-1 justify-start gap-1.5"
                          aria-haspopup="dialog"
                          aria-expanded={mobileCalendarOpen}
                          onClick={() => setMobileCalendarOpen(true)}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span className="truncate">{weekLabel}</span>
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              "ml-auto h-3.5 w-3.5 shrink-0 transition-transform",
                              mobileCalendarOpen && "rotate-180",
                            )}
                          />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleMobileToday}
                        >
                          Today
                        </Button>
                      </div>
                      <Dialog
                        open={mobileCalendarOpen}
                        onOpenChange={setMobileCalendarOpen}
                      >
                        <DialogContent className="w-auto p-0 sm:max-w-fit">
                          <DialogTitle className="sr-only">
                            Select date
                          </DialogTitle>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                handleMobileDateSelect(date);
                                setMobileCalendarOpen(false);
                              }
                            }}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            timeZone={placeTimeZone}
                          />
                        </DialogContent>
                      </Dialog>
                      <MobileDateStrip
                        selectedDate={selectedDate}
                        onDateSelect={handleMobileDateSelect}
                        timeZone={placeTimeZone}
                        todayDate={todayDate}
                      />
                    </div>

                    <div className="hidden 2xl:flex flex-wrap items-center justify-between gap-3">
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
                                    disabled={isDragDisabled}
                                    cellIndex={hourIndex}
                                    placing={isPlacingDraftRow}
                                    onPlace={handlePlaceDraftRow}
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
                                      isPending={pendingBlockIds.has(block.id)}
                                      onSelect={manageBlock.select}
                                      onResizePreview={
                                        (block.type === "WALK_IN" ||
                                          block.type === "MAINTENANCE") &&
                                        !pendingBlockIds.has(block.id)
                                          ? handleResizePreview
                                          : undefined
                                      }
                                      onResizeCommit={
                                        (block.type === "WALK_IN" ||
                                          block.type === "MAINTENANCE") &&
                                        !pendingBlockIds.has(block.id)
                                          ? handleResizeCommit
                                          : undefined
                                      }
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

                    <div className="2xl:hidden">
                      <MobileDayBlocksList
                        blocks={dayBlocks}
                        isLoading={blocksQuery.isLoading}
                        timeZone={placeTimeZone}
                        selectedDayLabel={selectedDayLabel}
                        onRemoveBlock={handleCancelBlock}
                        onConvertWalkIn={handleOpenReplaceDialog}
                        isCancelPending={cancelBlock.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hidden 2xl:block">
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
          guestProfilesData={
            (guestProfilesQuery.data ?? []) as Array<{
              id: string;
              displayName: string;
              phoneNumber: string | null;
            }>
          }
          guestProfilesLoading={guestProfilesQuery.isLoading}
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

        <ReplaceWithGuestDialog
          form={replaceWithGuestForm}
          onSubmit={handleReplaceWithGuestSubmit}
          isSubmitting={
            replaceWithGuestMutation.isPending ||
            convertWalkInMutation.isPending
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
          blockStartTime={replaceStartTime}
          blockEndTime={replaceEndTime}
          suggestedName={replaceSuggestedName}
          title={
            isWalkInReplace
              ? "Convert walk-in to guest booking"
              : "Replace with guest booking"
          }
          description={
            isWalkInReplace
              ? "Convert this walk-in block into a confirmed guest reservation."
              : "Replace the imported block with a confirmed guest reservation."
          }
          submitLabel={isWalkInReplace ? "Convert to guest" : "Replace block"}
        />

        {!is2xlUp && (
          <MobileSelectionPeekBar
            selectedTimeLabel={selectedTimeLabel}
            onOpen={() => setMobileDrawerOpen(true)}
          />
        )}

        {!is2xlUp ? (
          <MobileCreateBlockDrawer
            handleMobileSubmit={handleSelectionSubmit}
            isCreatingBlock={isCreatingBlock}
            mobileSelectedTimeLabel={selectedTimeLabel}
            placeTimeZone={placeTimeZone}
            organizationId={organization?.id ?? ""}
            onDrawerClose={handleMobileDrawerClose}
          />
        ) : null}

        {is2xlUp && (
          <ManageBlockDialog
            block={manageBlock.selectedBlock}
            timeZone={placeTimeZone}
            onClose={manageBlock.close}
            onRemove={manageBlock.remove}
            onConvertWalkIn={manageBlock.convertWalkIn}
            onReplaceWithGuest={manageBlock.replaceWithGuest}
            isImported={
              manageBlock.selectedId
                ? isImportCommitted &&
                  importedBlockIds.has(manageBlock.selectedId) &&
                  !replacedBlockIds.has(manageBlock.selectedId)
                : false
            }
          />
        )}

        {!is2xlUp && (
          <MobileManageBlockPeekBar
            block={manageBlock.selectedBlock}
            timeZone={placeTimeZone}
            onDismiss={manageBlock.close}
            onRemove={manageBlock.remove}
            onConvertWalkIn={manageBlock.convertWalkIn}
            onReplaceWithGuest={manageBlock.replaceWithGuest}
            isImported={
              manageBlock.selectedId
                ? isImportCommitted &&
                  importedBlockIds.has(manageBlock.selectedId) &&
                  !replacedBlockIds.has(manageBlock.selectedId)
                : false
            }
            isCancelPending={cancelBlock.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}
