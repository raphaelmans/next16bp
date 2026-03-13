"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData } from "@tanstack/react-query";
import { addDays, addMinutes, differenceInMinutes } from "date-fns";
import debounce from "debounce";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { useFeatureQueryCache } from "@/common/feature-api-hooks";
import { formatTimeRangeInTimeZone } from "@/common/format";
import { LIVE_QUERY_OPTIONS } from "@/common/live-query-options";
import { DEFAULT_TIME_ZONE } from "@/common/location-defaults";
import {
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  toUtcISOString,
} from "@/common/time-zone";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
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
import { getOwnerApi } from "@/features/owner/api.runtime";
import {
  buildBlocksRange,
  buildDraftRowsState,
  buildDraftWeekTimelineBlocksByDayKey,
  buildWeekTimelineBlocksByDayKey,
  buildWeekTimelineReservationsByDayKey,
  getBlockCtaLabel,
  getWeekDayKeys,
  resolveOwnerRangeAcrossWeekBoundary,
} from "@/features/owner/booking-studio/helpers";
import { useBookingStudioViewState } from "@/features/owner/booking-studio/hooks";
import { AvailabilityStudioLoadingShell } from "@/features/owner/components/availability-studio/availability-studio-loading-shell";
import { AvailabilityStudioToolbar } from "@/features/owner/components/availability-studio/availability-studio-toolbar";
import {
  BookingStudioProvider,
  useBookingStudio,
} from "@/features/owner/components/booking-studio/booking-studio-provider";
import { CancelReservationDialog } from "@/features/owner/components/booking-studio/cancel-reservation-dialog";
import { getOperatingHoursForWeek } from "@/features/owner/components/booking-studio/court-hours";
import { CustomBlockDialog } from "@/features/owner/components/booking-studio/custom-block-dialog";
import { DraftRowCard } from "@/features/owner/components/booking-studio/draft-row-card";
import { GuestBookingDialog } from "@/features/owner/components/booking-studio/guest-booking-dialog";
import { ManageBlockDialog } from "@/features/owner/components/booking-studio/manage-block-dialog";
import { MobileCreateBlockDrawer } from "@/features/owner/components/booking-studio/mobile-create-block-drawer";
import { MobileManageBlockPeekBar } from "@/features/owner/components/booking-studio/mobile-manage-block-peek-bar";
import { MobileSelectionPeekBar } from "@/features/owner/components/booking-studio/mobile-selection-peek-bar";
import { OwnerAvailabilityWeekGrid } from "@/features/owner/components/booking-studio/owner-availability-week-grid";
import { RemoveBlockDialog } from "@/features/owner/components/booking-studio/remove-block-dialog";
import { ReplaceWithGuestDialog } from "@/features/owner/components/booking-studio/replace-with-guest-dialog";
import { computeClampedResizeRange } from "@/features/owner/components/booking-studio/resize-helpers";
import { SelectionPanelForm } from "@/features/owner/components/booking-studio/selection-panel-form";
import {
  buildDateFromDayKey,
  COMPACT_TIMELINE_ROW_HEIGHT,
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
  TIMELINE_ROW_HEIGHT,
} from "@/features/owner/components/booking-studio/types";
import { useIs2xlUp } from "@/features/owner/components/booking-studio/use-is-2xl-up";
import { useManageBlock } from "@/features/owner/components/booking-studio/use-manage-block";
import {
  appendAvailabilityBlock,
  reconcileAvailabilityBlockInRange,
  removeAvailabilityBlock,
  replaceAvailabilityBlock,
  updateAvailabilityBlockRange,
  useModCourtHours,
  useModOwnerAvailabilityReservationSync,
  useModOwnerCourtFilter,
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
  useQueryOwnerPlaceById,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";

const ownerApi = getOwnerApi();

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
  const { data: placeData } = useQueryOwnerPlaceById(
    { placeId },
    { enabled: !!placeId },
  );
  const { data: courts = [], isLoading: courtsLoading } =
    useQueryOwnerCourtsByPlace(placeId);

  const placeTimeZone = placeData?.place.timeZone ?? DEFAULT_TIME_ZONE;
  const selectedCourt = React.useMemo(
    () => courts.find((court) => court.id === courtId),
    [courtId, courts],
  );

  const is2xlUp = useIs2xlUp();

  const {
    dayKey,
    selectedDate,
    weekDayKeys,
    weekLabel,
    todayDayKey,
    visibleDayKeys,
    handleMobileDateSelect,
    handleMobileToday,
    navigateWeek,
  } = useBookingStudioViewState({
    timeZone: placeTimeZone,
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
  const setSelectedReservation = useBookingStudio(
    (s) => s.setSelectedReservation,
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

  const hours = React.useMemo(() => {
    const windows = courtHoursQuery.data ?? [];
    return getOperatingHoursForWeek(windows, weekDayKeys, placeTimeZone);
  }, [courtHoursQuery.data, weekDayKeys, placeTimeZone]);

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
    ...LIVE_QUERY_OPTIONS,
    enabled: Boolean(courtId),
    placeholderData: keepPreviousData,
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
    {
      ...LIVE_QUERY_OPTIONS,
      enabled: Boolean(courtId),
      placeholderData: keepPreviousData,
    },
  );

  useModOwnerAvailabilityReservationSync({
    enabled: Boolean(courtId),
    reservationsQueryInput,
  });

  const [isRefreshingAvailability, setIsRefreshingAvailability] =
    React.useState(false);

  const canRefreshAvailability = Boolean(courtId || (isImportOverlay && jobId));
  const isAvailabilityFetching =
    blocksQuery.isFetching ||
    reservationsQuery.isFetching ||
    courtHoursQuery.isFetching ||
    (isImportOverlay && (jobQuery.isFetching || rowsQuery.isFetching));

  const handleRefreshAvailability = React.useCallback(async () => {
    if (!canRefreshAvailability) return;

    setIsRefreshingAvailability(true);
    try {
      const refreshTasks: Array<Promise<unknown>> = [];

      if (courtId) {
        refreshTasks.push(courtHoursQuery.refetch());
        refreshTasks.push(blocksQuery.refetch());
        refreshTasks.push(reservationsQuery.refetch());
      }

      if (isImportOverlay && jobId) {
        refreshTasks.push(jobQuery.refetch());
        refreshTasks.push(rowsQuery.refetch());
      }

      await Promise.all(refreshTasks);
    } finally {
      setIsRefreshingAvailability(false);
    }
  }, [
    blocksQuery,
    canRefreshAvailability,
    courtHoursQuery,
    courtId,
    isImportOverlay,
    jobId,
    jobQuery,
    reservationsQuery,
    rowsQuery,
  ]);

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

  const weekRowHeight = is2xlUp
    ? TIMELINE_ROW_HEIGHT
    : COMPACT_TIMELINE_ROW_HEIGHT;

  const weekTimelineBlocksByDayKey = React.useMemo(() => {
    return buildWeekTimelineBlocksByDayKey({
      blocks: activeBlocks,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      rowHeight: weekRowHeight,
    });
  }, [activeBlocks, placeTimeZone, hours, weekDayKeys, weekRowHeight]);

  const weekTimelineReservationsByDayKey = React.useMemo(() => {
    return buildWeekTimelineReservationsByDayKey({
      reservations: activeReservations,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      rowHeight: weekRowHeight,
    });
  }, [activeReservations, placeTimeZone, hours, weekDayKeys, weekRowHeight]);

  const draftWeekTimelineBlocksByDayKey = React.useMemo(() => {
    if (!isImportOverlay) {
      return new Map();
    }
    return buildDraftWeekTimelineBlocksByDayKey({
      draftRows,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      courtId,
      rowHeight: weekRowHeight,
    });
  }, [
    courtId,
    draftRows,
    isImportOverlay,
    placeTimeZone,
    hours,
    weekDayKeys,
    weekRowHeight,
  ]);

  const featureCache = useFeatureQueryCache();
  const {
    invalidateActiveReservationsForCourtRange,
    invalidateCourtBlocksRange,
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
      await featureCache.cancel(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );
      const previousBlocks = featureCache.getData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );

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

      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) => appendAvailabilityBlock(old, optimisticBlock),
      );
      updatePendingBlockId(optimisticId, 1);

      return { previousBlocks, optimisticId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        featureCache.setData(
          ["courtBlock", "listForCourtRange"],
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
      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) =>
          replaceAvailabilityBlock(old, context?.optimisticId, nextBlock),
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
      await featureCache.cancel(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );
      const previousBlocks = featureCache.getData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );

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

      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) => appendAvailabilityBlock(old, optimisticBlock),
      );
      updatePendingBlockId(optimisticId, 1);

      return { previousBlocks, optimisticId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        featureCache.setData(
          ["courtBlock", "listForCourtRange"],
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
      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) =>
          replaceAvailabilityBlock(old, context?.optimisticId, nextBlock),
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
      await featureCache.cancel(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );
      const previousBlocks = featureCache.getData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
      );

      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) => removeAvailabilityBlock(old, variables.blockId),
      );
      updatePendingBlockId(variables.blockId, 1);

      return { previousBlocks, blockId: variables.blockId };
    },
    onError(_error, _variables, context) {
      if (context?.previousBlocks !== undefined) {
        featureCache.setData(
          ["courtBlock", "listForCourtRange"],
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

        featureCache.setData(
          ["courtBlock", "listForCourtRange"],
          blocksQueryInput,
          (old) =>
            reconcileAvailabilityBlockInRange(
              old,
              blockId,
              serverBlock,
              isInRange,
            ),
        );
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
      featureCache,
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
      await featureCache.cancel(
        ["bookingsImport", "listRows"],
        draftRowsQueryInput,
      );
      const previousRows = featureCache.getData(
        ["bookingsImport", "listRows"],
        draftRowsQueryInput,
      );

      featureCache.setData(
        ["bookingsImport", "listRows"],
        draftRowsQueryInput,
        (old) =>
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
        featureCache.setData(
          ["bookingsImport", "listRows"],
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
          toast.error("Select a venue first");
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
      void invalidateImportRowsAndJob(draftRowsQueryInput, { jobId });
    },
    onError(error) {
      toast.error("Unable to replace block", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });
  const convertWalkInMutation = useMutOwnerConvertWalkInBlockToGuest({
    onSettled() {
      void invalidateCourtBlocksRange(blocksQueryInput);
      void invalidateActiveReservationsForCourtRange(reservationsQueryInput);
    },
    onSuccess() {
      toast.success("Walk-in converted to guest booking");
      closeReplaceDialog();
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
      void invalidateImportRowsAndJob(draftRowsQueryInput, { jobId });
      setJobIdParam(null);
    } catch (error) {
      toast.error("Unable to discard import", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  }, [
    discardImport,
    draftRowsQueryInput,
    invalidateImportRowsAndJob,
    jobId,
    setJobIdParam,
  ]);

  // Track which day column committed the range in week view
  const [weekCommittedDayKey, setWeekCommittedDayKey] = React.useState<
    string | null
  >(null);
  const [weekCommittedEndDayKey, setWeekCommittedEndDayKey] = React.useState<
    string | null
  >(null);

  const handleWeekCommitRange = React.useCallback(
    (
      startDayKey: string,
      startHourIdx: number,
      endDayKey: string,
      endHourIdx: number,
    ) => {
      // Attempt cross-week merge when an existing committed range is on an
      // adjacent week (e.g. Saturday → navigate → select Sunday).
      if (
        weekCommittedDayKey &&
        committedRange &&
        !weekDayKeys.includes(weekCommittedDayKey)
      ) {
        const merged = resolveOwnerRangeAcrossWeekBoundary({
          oldStartDayKey: weekCommittedDayKey,
          oldStartHourIdx: committedRange.startIdx,
          oldEndDayKey: weekCommittedEndDayKey ?? weekCommittedDayKey,
          oldEndHourIdx: committedRange.endIdx,
          newStartDayKey: startDayKey,
          newStartHourIdx: startHourIdx,
          newEndDayKey: endDayKey,
          newEndHourIdx: endHourIdx,
          hours,
          timeZone: placeTimeZone,
          blocksByDay: weekTimelineBlocksByDayKey,
          reservationsByDay: weekTimelineReservationsByDayKey,
        });
        setCommittedRange({
          startIdx: merged.startHourIdx,
          endIdx: merged.endHourIdx,
        });
        setWeekCommittedDayKey(merged.startDayKey);
        setWeekCommittedEndDayKey(merged.endDayKey);
        manageBlock.close();
        return;
      }

      setCommittedRange({ startIdx: startHourIdx, endIdx: endHourIdx });
      setWeekCommittedDayKey(startDayKey);
      setWeekCommittedEndDayKey(endDayKey);
      manageBlock.close();
    },
    [
      weekCommittedDayKey,
      weekCommittedEndDayKey,
      committedRange,
      weekDayKeys,
      hours,
      placeTimeZone,
      weekTimelineBlocksByDayKey,
      weekTimelineReservationsByDayKey,
      setCommittedRange,
      manageBlock.close,
    ],
  );

  const handleWeekClearRange = React.useCallback(() => {
    setCommittedRange(null);
    setWeekCommittedDayKey(null);
    setWeekCommittedEndDayKey(null);
    manageBlock.close();
  }, [setCommittedRange, manageBlock.close]);

  // Prefetch next week's blocks + reservations for instant navigation
  const prefetchedWeeksRef = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (!courtId || blocksQuery.isLoading) return;

    const weekStart = weekDayKeys[0];
    if (!weekStart) return;

    const nextWeekStartDate = addDays(
      getZonedDayRangeFromDayKey(weekStart, placeTimeZone).start,
      7,
    );
    const nextWeekStartDayKey = getZonedDayKey(
      nextWeekStartDate,
      placeTimeZone,
    );
    const nextWeekDays = getWeekDayKeys(nextWeekStartDayKey, placeTimeZone);
    const nextRange = buildBlocksRange({
      dayKey: nextWeekStartDayKey,
      visibleDayKeys: nextWeekDays,
      timeZone: placeTimeZone,
    });

    const cacheKey = `${courtId}:${nextWeekStartDayKey}`;
    if (prefetchedWeeksRef.current.has(cacheKey)) return;
    prefetchedWeeksRef.current.add(cacheKey);

    const nextStartIso = toUtcISOString(nextRange.start);
    const nextEndIso = toUtcISOString(nextRange.end);
    const input = { courtId, startTime: nextStartIso, endTime: nextEndIso };

    void featureCache
      .fetch(["courtBlock", "listForCourtRange"], input, () =>
        ownerApi.queryCourtBlockListForCourtRange(input),
      )
      .catch(() => {
        prefetchedWeeksRef.current.delete(cacheKey);
      });
    void featureCache
      .fetch(["reservationOwner", "getActiveForCourtRange"], input, () =>
        ownerApi.queryReservationOwnerGetActiveForCourtRange(input),
      )
      .catch(() => {
        prefetchedWeeksRef.current.delete(cacheKey);
      });
  }, [
    courtId,
    blocksQuery.isLoading,
    weekDayKeys,
    placeTimeZone,
    featureCache,
  ]);

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
  const committedDayKey = weekCommittedDayKey ?? dayKey;
  const committedEndDayKey = weekCommittedEndDayKey ?? committedDayKey;

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
    const e = buildDateFromDayKey(committedEndDayKey, endMin, placeTimeZone);
    return formatTimeRangeInTimeZone(s, e, placeTimeZone);
  }, [
    committedDayKey,
    committedEndDayKey,
    committedRange,
    hours,
    placeTimeZone,
  ]);

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

      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) =>
          updateAvailabilityBlockRange(old, args.blockId, {
            startTime: nextStartIso,
            endTime: nextEndIso,
          }),
      );
    },
    [blocksQueryInput, computeNextResizeRange, featureCache],
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

      featureCache.setData(
        ["courtBlock", "listForCourtRange"],
        blocksQueryInput,
        (old) =>
          updateAvailabilityBlockRange(old, args.blockId, {
            startTime: nextStartIso,
            endTime: nextEndIso,
          }),
      );

      if (!isOptimisticBlockId(args.blockId)) {
        scheduleRangeFlushRef.current(args.blockId);
      }
    },
    [blocksQueryInput, computeNextResizeRange, featureCache],
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
        toast.error("Select a venue first");
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
        toast.error("Select a venue and time range first");
        return;
      }
      const effectiveDayKey = weekCommittedDayKey ?? dayKey;
      const effectiveEndDayKey = weekCommittedEndDayKey ?? effectiveDayKey;
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
      const e = buildDateFromDayKey(effectiveEndDayKey, endMin, placeTimeZone);

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
    selectionBlockType,
    committedRange,
    organization?.id,
    placeTimeZone,
    resetSelectionPanel,
    weekCommittedDayKey,
    weekCommittedEndDayKey,
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
      <div className="space-y-6 pb-24 2xl:pb-0">
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
                    <span className="font-medium text-success">
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
          placesLoading={placesLoading}
          courtId={courtId}
          courts={courts}
          courtsLoading={courtsLoading}
          onPlaceChange={setPlaceId}
          onCourtChange={setCourtId}
        />

        <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)]">
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
                {committedRange ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
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
                        loading={isCreatingBlock}
                      >
                        {getBlockCtaLabel(selectionBlockType)}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resetSelectionPanel()}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="size-4 text-primary/60" />
                        <h3 className="text-sm font-heading font-semibold">
                          Create Block
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click a start time, then an end time on the timeline to
                        select a range.
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
                  </div>
                )}
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
            <CardContent className="space-y-4 p-4 2xl:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 2xl:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 2xl:h-9 2xl:w-9"
                    onClick={() => navigateWeek(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1.5 text-sm font-heading font-semibold 2xl:text-lg 2xl:pointer-events-none"
                    onClick={() => setMobileCalendarOpen(true)}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 2xl:hidden" />
                    {weekLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 2xl:h-9 2xl:w-9"
                    onClick={() => navigateWeek(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRefreshAvailability()}
                    disabled={
                      !canRefreshAvailability || isRefreshingAvailability
                    }
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshingAvailability || isAvailabilityFetching
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="2xl:hidden"
                    onClick={handleMobileToday}
                  >
                    Today
                  </Button>
                  <Badge variant="outline" className="hidden 2xl:inline-flex">
                    Snap: 60m
                  </Badge>
                </div>
              </div>

              <Dialog
                open={mobileCalendarOpen}
                onOpenChange={setMobileCalendarOpen}
              >
                <DialogContent className="w-auto p-0 sm:max-w-fit 2xl:hidden">
                  <DialogTitle className="sr-only">Select date</DialogTitle>
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

              {!placeId || !courtId ? (
                <Alert>
                  <AlertTitle>Select a venue</AlertTitle>
                  <AlertDescription>
                    Choose a venue to load the week grid.
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
                <OwnerAvailabilityWeekGrid
                  weekDays={weekDayKeys}
                  hours={hours}
                  timeZone={placeTimeZone}
                  compact={!is2xlUp}
                  blocksByDay={weekTimelineBlocksByDayKey}
                  draftBlocksByDay={draftWeekTimelineBlocksByDayKey}
                  reservationsByDay={weekTimelineReservationsByDayKey}
                  courtHoursWindows={courtHoursQuery.data ?? []}
                  pendingBlockIds={pendingBlockIds}
                  onSelectBlock={manageBlock.select}
                  onSelectReservation={setSelectedReservation}
                  placing={isPlacingDraftRow}
                  onPlace={handlePlaceDraftRow}
                  onResizePreview={handleResizePreview}
                  onResizeCommit={handleResizeCommit}
                  committedRange={committedRange}
                  weekCommittedDayKey={weekCommittedDayKey}
                  weekCommittedEndDayKey={weekCommittedEndDayKey}
                  onCommitRange={handleWeekCommitRange}
                  onClearRange={handleWeekClearRange}
                  disabled={isDragDisabled}
                  todayDayKey={todayDayKey}
                  blocksLoading={blocksQuery.isFetching}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <RemoveBlockDialog confirmRemoveBlock={confirmRemoveBlock} />
        <CancelReservationDialog timeZone={placeTimeZone} />

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
