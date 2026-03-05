"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData } from "@tanstack/react-query";
import { addDays, addMinutes } from "date-fns";
import debounce from "debounce";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { formatTimeRangeInTimeZone } from "@/common/format";
import { DEFAULT_TIME_ZONE } from "@/common/location-defaults";
import {
  getReservationEnablement,
  type ReservationEnablementIssueCode,
} from "@/common/reservation-enablement";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
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
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  buildBlocksRange,
  buildWeekTimelineBlocksByDayKey,
  buildWeekTimelineReservationsByDayKey,
  getBlockCtaLabel,
  getWeekDayKeys,
  resolveOwnerRangeAcrossWeekBoundary,
} from "@/features/owner/booking-studio/helpers";
import { useBookingStudioViewState } from "@/features/owner/booking-studio/hooks";
import { ReservationAlertsPanel } from "@/features/owner/components";
import {
  BookingStudioProvider,
  useBookingStudio,
} from "@/features/owner/components/booking-studio/booking-studio-provider";
import { getOperatingHoursForWeek } from "@/features/owner/components/booking-studio/court-hours";
import { CustomBlockDialog } from "@/features/owner/components/booking-studio/custom-block-dialog";
import { GuestBookingDialog } from "@/features/owner/components/booking-studio/guest-booking-dialog";
import { ManageBlockDialog } from "@/features/owner/components/booking-studio/manage-block-dialog";
import { MobileCreateBlockDrawer } from "@/features/owner/components/booking-studio/mobile-create-block-drawer";
import { MobileManageBlockPeekBar } from "@/features/owner/components/booking-studio/mobile-manage-block-peek-bar";
import { MobileSelectionPeekBar } from "@/features/owner/components/booking-studio/mobile-selection-peek-bar";
import { OwnerAvailabilityWeekGrid } from "@/features/owner/components/booking-studio/owner-availability-week-grid";
import { RemoveBlockDialog } from "@/features/owner/components/booking-studio/remove-block-dialog";
import { computeClampedResizeRange } from "@/features/owner/components/booking-studio/resize-helpers";
import { SelectionPanelForm } from "@/features/owner/components/booking-studio/selection-panel-form";
import {
  buildDateFromDayKey,
  COMPACT_TIMELINE_ROW_HEIGHT,
  type CourtBlockItem,
  type CustomBlockFormValues,
  customBlockSchema,
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
import { CourtPageNav } from "@/features/owner/components/court-page-nav";
import { AvailabilityEnablementAlerts } from "@/features/owner/components/place-court-availability/availability-enablement-alerts";
import { OwnerCourtAvailabilityLoadingState } from "@/features/owner/components/place-court-availability/owner-court-availability-loading-state";
import {
  useModCourtHours,
  useModCourtRateRules,
  useModOwnerCourtStudioTransport,
  useModOwnerInvalidation,
  useMutOwnerCourtBlockCancel,
  useMutOwnerCourtBlockCreateMaintenance,
  useMutOwnerCourtBlockCreateWalkIn,
  useMutOwnerCourtBlockUpdateRange,
  useMutOwnerCreateGuestBooking,
  useMutOwnerGuestProfileCreate,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerActiveReservationsForCourtRange,
  useQueryOwnerCourtBlocksForRange,
  useQueryOwnerCourtById,
  useQueryOwnerGuestProfiles,
  useQueryOwnerOrganization,
  useQueryOwnerPlaceById,
} from "@/features/owner/hooks";

export default function OwnerCourtAvailabilityPage() {
  const params = useParams<{ placeId: string; courtId: string }>();
  return (
    <BookingStudioProvider initialDate={new Date()}>
      <OwnerCourtAvailabilityInner
        placeId={params.placeId}
        courtId={params.courtId}
      />
    </BookingStudioProvider>
  );
}

/**
 * Embeddable availability coordinator content.
 * Wraps OwnerCourtAvailabilityInner with BookingStudioProvider so it can
 * render inside a Sheet or any container without AppShell.
 */
export function AvailabilityCoordinatorContent(props: {
  placeId: string;
  courtId: string;
}) {
  return (
    <BookingStudioProvider initialDate={new Date()}>
      <OwnerCourtAvailabilityInner
        placeId={props.placeId}
        courtId={props.courtId}
        embedded
      />
    </BookingStudioProvider>
  );
}

type OwnerCourtAvailabilityInnerProps = {
  placeId: string;
  courtId: string;
  embedded?: boolean;
};

function OwnerCourtAvailabilityInner({
  placeId,
  courtId,
  embedded = false,
}: OwnerCourtAvailabilityInnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromSetup = searchParams.get("from") === "setup";

  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const paymentMethodsQuery = useQueryOrganizationPaymentMethods(
    organization?.id ?? undefined,
  );

  const { data: placeData, isLoading: placeLoading } = useQueryOwnerPlaceById(
    { placeId },
    { enabled: !!placeId },
  );

  const { data: courtData, isLoading: courtLoading } = useQueryOwnerCourtById(
    { courtId },
    { enabled: !!courtId },
  );

  const placeTimeZone = placeData?.place.timeZone ?? DEFAULT_TIME_ZONE;
  const is2xlUp = useIs2xlUp();
  const {
    dayKey,
    setDayKeyParam,
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
    const timer = setTimeout(() => setDebouncedGuestSearch(guestSearch), 2000);
    return () => clearTimeout(timer);
  }, [guestSearch, setDebouncedGuestSearch]);

  // Timeline range from court hours
  const courtHoursQuery = useModCourtHours(courtId);
  const courtRateRulesQuery = useModCourtRateRules(courtId);

  const hours = React.useMemo(() => {
    const windows = courtHoursQuery.data ?? [];
    return getOperatingHoursForWeek(windows, weekDayKeys, placeTimeZone);
  }, [courtHoursQuery.data, weekDayKeys, placeTimeZone]);

  const timelineStartMinute = (hours[0] ?? 6) * 60;

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

  const blocksQuery = useQueryOwnerCourtBlocksForRange(blocksQueryInput, {
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
    { enabled: Boolean(courtId), placeholderData: keepPreviousData },
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

  const weekRowHeight = is2xlUp
    ? TIMELINE_ROW_HEIGHT
    : COMPACT_TIMELINE_ROW_HEIGHT;

  // Week view timeline items (blocks mapped by day key)
  const weekTimelineBlocksByDayKey = React.useMemo(() => {
    return buildWeekTimelineBlocksByDayKey({
      blocks: activeBlocks,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      rowHeight: weekRowHeight,
    });
  }, [activeBlocks, hours, placeTimeZone, weekDayKeys, weekRowHeight]);

  const weekTimelineReservationsByDayKey = React.useMemo(() => {
    return buildWeekTimelineReservationsByDayKey({
      reservations: activeReservations,
      weekDayKeys,
      timeZone: placeTimeZone,
      hours,
      rowHeight: weekRowHeight,
    });
  }, [activeReservations, hours, placeTimeZone, weekDayKeys, weekRowHeight]);

  const emptyDraftBlocksByDay = React.useMemo(() => new Map(), []);

  // Mutations
  const utils = useModOwnerCourtStudioTransport();
  const {
    invalidateActiveReservationsForCourtRange,
    invalidateCourtBlocksRange,
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

  // --- Block range resize (optimistic + debounced) ---
  const pendingRangeUpdates = React.useRef<
    Map<string, { startTime: string; endTime: string; version: number }>
  >(new Map());
  const rangeUpdateVersions = React.useRef<Map<string, number>>(new Map());
  const debouncedFlushByBlock = React.useRef<
    Map<string, ReturnType<typeof debounce>>
  >(new Map());

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
          const filtered = existing.filter((b) => b.id !== blockId);
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

  const manageBlock = useManageBlock({
    activeBlocksById,
    onCancelBlock: handleCancelBlock,
    onSelect: resetSelectionPanel,
  });

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
    { enabled: guestBookingOpen && !!organization?.id },
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

  // Week committed range tracking
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

    void utils.courtBlock.listForCourtRange.fetch(input).catch(() => {
      prefetchedWeeksRef.current.delete(cacheKey);
    });
    void utils.reservationOwner.getActiveForCourtRange
      .fetch(input)
      .catch(() => {
        prefetchedWeeksRef.current.delete(cacheKey);
      });
  }, [courtId, blocksQuery.isLoading, weekDayKeys, placeTimeZone, utils]);

  const committedDayKey = weekCommittedDayKey ?? dayKey;
  const committedEndDayKey = weekCommittedEndDayKey ?? committedDayKey;

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

  const shouldReduceMotion = useReducedMotion();

  // Custom block dialog
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

  const isSubmittingSelectionRef = React.useRef(false);
  const handleSelectionSubmit = React.useCallback(async () => {
    if (isSubmittingSelectionRef.current) return;
    isSubmittingSelectionRef.current = true;
    try {
      if (!committedRange) {
        toast.error("Select a time range first");
        return;
      }
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
      const s = buildDateFromDayKey(committedDayKey, startMin, placeTimeZone);
      const e = buildDateFromDayKey(committedEndDayKey, endMin, placeTimeZone);

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
      setWeekCommittedDayKey(null);
      setWeekCommittedEndDayKey(null);
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
    committedDayKey,
    committedEndDayKey,
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
    hours,
  ]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.courts.availability(placeId, courtId),
    );
  };

  const scheduleHrefBase = appRoutes.organization.places.courts.schedule(
    placeId,
    courtId,
  );
  const scheduleHref = isFromSetup
    ? `${scheduleHrefBase}?from=setup`
    : scheduleHrefBase;
  const reservationsHref = `${appRoutes.organization.reservations}?placeId=${placeId}&courtId=${courtId}`;
  const paymentMethodsHref = `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`;

  if (orgLoading || courtLoading || placeLoading) {
    return <OwnerCourtAvailabilityLoadingState />;
  }

  if (!courtData || !placeData) {
    if (!embedded) {
      router.push(appRoutes.organization.places.courts.base(placeId));
    }
    return null;
  }

  const verificationHref = appRoutes.organization.verification.place(placeId);
  const verificationStatus = placeData.verification?.status ?? "UNVERIFIED";
  const reservationsEnabled =
    placeData.verification?.reservationsEnabled ?? false;
  const hasHoursWindows = courtHoursQuery.data
    ? courtHoursQuery.data.length > 0
    : null;
  const hasRateRules = courtRateRulesQuery.data
    ? courtRateRulesQuery.data.length > 0
    : null;
  const hasPaymentMethods = paymentMethodsQuery.data
    ? paymentMethodsQuery.data.methods.some((method) => method.isActive)
    : null;
  const enablement = getReservationEnablement({
    placeType: placeData.place.placeType,
    verificationStatus,
    reservationsEnabled,
    hasPaymentMethods,
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
  const showPaymentMethodBanner = hasIssue("NO_PAYMENT_METHOD");
  const showScheduleBanner = hasIssue("NO_SCHEDULE");
  const showPricingBanner = hasIssue("NO_PRICING");

  const content = (
    <div className="space-y-6 pb-24 lg:pb-0">
      <PageHeader
        title={courtData.court.label}
        breadcrumbs={[
          { label: "My Venues", href: appRoutes.organization.places.base },
          {
            label: placeData.place.name,
            href: appRoutes.organization.places.courts.base(placeId),
          },
          { label: courtData.court.label },
        ]}
        breadcrumbClassName="hidden sm:block"
        backHref={appRoutes.organization.places.courts.base(placeId)}
        actions={
          <>
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

      <CourtPageNav placeId={placeId} courtId={courtId} />

      <AvailabilityEnablementAlerts
        showVerificationBanner={showVerificationBanner}
        showReservationsDisabledBanner={showReservationsDisabledBanner}
        showPaymentMethodBanner={showPaymentMethodBanner}
        showScheduleBanner={showScheduleBanner}
        showPricingBanner={showPricingBanner}
        verificationStatus={verificationStatus}
        verificationHref={verificationHref}
        scheduleHref={scheduleHref}
        paymentMethodsHref={paymentMethodsHref}
      />

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
                      shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
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
                        {getBlockCtaLabel(selectionBlockType, isCreatingBlock)}
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
                      shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
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
                        Click a start time, then an end time on any day column
                        to select a range.
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
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 lg:gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 lg:h-9 lg:w-9"
                  onClick={() => navigateWeek(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-1.5 text-sm font-heading font-semibold lg:text-lg lg:pointer-events-none"
                  onClick={() => setMobileCalendarOpen(true)}
                >
                  <CalendarIcon className="h-3.5 w-3.5 lg:hidden" />
                  {weekLabel}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 lg:h-9 lg:w-9"
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
                  className="lg:hidden"
                  onClick={handleMobileToday}
                >
                  Today
                </Button>
                <Badge variant="outline" className="hidden lg:inline-flex">
                  Snap: 60m
                </Badge>
              </div>
            </div>

            <Dialog
              open={mobileCalendarOpen}
              onOpenChange={setMobileCalendarOpen}
            >
              <DialogContent className="w-auto p-0 sm:max-w-fit lg:hidden">
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
              <OwnerAvailabilityWeekGrid
                weekDays={weekDayKeys}
                hours={hours}
                timeZone={placeTimeZone}
                compact={!is2xlUp}
                blocksByDay={weekTimelineBlocksByDayKey}
                draftBlocksByDay={emptyDraftBlocksByDay}
                reservationsByDay={weekTimelineReservationsByDayKey}
                courtHoursWindows={courtHoursQuery.data ?? []}
                pendingBlockIds={pendingBlockIds}
                onSelectBlock={manageBlock.select}
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
                committedRange={committedRange}
                weekCommittedDayKey={weekCommittedDayKey}
                weekCommittedEndDayKey={weekCommittedEndDayKey}
                onCommitRange={handleWeekCommitRange}
                onClearRange={handleWeekClearRange}
                disabled={false}
                todayDayKey={todayDayKey}
                blocksLoading={blocksQuery.isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>

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

      {!is2xlUp && (
        <MobileSelectionPeekBar
          selectedTimeLabel={selectedTimeLabel}
          onOpen={() => setMobileDrawerOpen(true)}
        />
      )}

      {is2xlUp && (
        <ManageBlockDialog
          block={manageBlock.selectedBlock}
          timeZone={placeTimeZone}
          onClose={manageBlock.close}
          onRemove={manageBlock.remove}
        />
      )}

      {!is2xlUp && (
        <MobileManageBlockPeekBar
          block={manageBlock.selectedBlock}
          timeZone={placeTimeZone}
          onDismiss={manageBlock.close}
          onRemove={manageBlock.remove}
          isCancelPending={cancelBlock.isPending}
        />
      )}
    </div>
  );

  if (embedded) {
    return content;
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
      {content}
    </AppShell>
  );
}
