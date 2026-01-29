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
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addMinutes, differenceInMinutes, format } from "date-fns";
import debounce from "debounce";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner";
import {
  useCourtHours,
  useOwnerCourtFilter,
  useOwnerCourtsByPlace,
  useOwnerOrganization,
  useOwnerPlaceFilter,
  useOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  formatCurrency,
  formatDuration,
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

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 22;
const TIMELINE_ROW_HEIGHT = 56;

const generateOptimisticId = () =>
  `optimistic:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;

const isOptimisticBlockId = (blockId: string) =>
  blockId.startsWith("optimistic:");

const studioViewSchema = ["day", "week"] as const;
type StudioView = (typeof studioViewSchema)[number];

type BlockPreset = {
  id: string;
  label: string;
  blockType: "MAINTENANCE" | "WALK_IN" | "GUEST_BOOKING";
  durationMinutes: number;
  badgeVariant: "warning" | "paid" | "default";
  description: string;
};

type DragPreset = {
  kind: "preset";
  preset: BlockPreset;
};

type DragBlock = {
  kind: "block";
  blockId: string;
};

type DragResizeHandle = {
  kind: "resize";
  blockId: string;
  edge: "start" | "end";
};

type DragDraftRow = {
  kind: "draft-row";
  rowId: string;
};

type DragItem = DragPreset | DragBlock | DragResizeHandle | DragDraftRow;

type TimelineCellData = {
  kind: "timeline-cell";
  dayKey: string;
  startMinute: number;
};

type DraftRowStatus =
  | "VALID"
  | "ERROR"
  | "WARNING"
  | "PENDING"
  | "COMMITTED"
  | "SKIPPED";

type CourtBlockItem = {
  id: string;
  courtId: string;
  type: "MAINTENANCE" | "WALK_IN";
  startTime: string;
  endTime: string;
  reason: string | null;
  totalPriceCents: number;
  currency: string;
  isActive: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReservationItem = {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPriceCents: number;
  currency: string;
  playerNameSnapshot: string | null;
  guestProfileId: string | null;
  playerId: string | null;
};

type DraftRowItem = {
  id: string;
  lineNumber: number;
  status: DraftRowStatus;
  courtId: string | null;
  courtLabel: string | null;
  startTime: Date | string | null;
  endTime: Date | string | null;
  reason: string | null;
  errors: string[] | null;
  warnings: string[] | null;
};

const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: "preset-walkin-60",
    label: "1h Walk-in",
    blockType: "WALK_IN",
    durationMinutes: 60,
    badgeVariant: "paid",
    description: "Reserve for walk-in customers.",
  },
  {
    id: "preset-maintenance-60",
    label: "1h Maintenance",
    blockType: "MAINTENANCE",
    durationMinutes: 60,
    badgeVariant: "warning",
    description: "Block for repairs or private events.",
  },
  {
    id: "preset-guest-60",
    label: "1h Guest booking",
    blockType: "GUEST_BOOKING",
    durationMinutes: 60,
    badgeVariant: "default",
    description: "Create a confirmed reservation for a guest.",
  },
];

const DRAFT_STATUS_PRIORITY: Record<DraftRowStatus, number> = {
  ERROR: 0,
  WARNING: 1,
  VALID: 2,
  PENDING: 3,
  COMMITTED: 4,
  SKIPPED: 5,
};

const DRAFT_STATUS_BADGE: Record<
  DraftRowStatus,
  "destructive" | "warning" | "success" | "secondary"
> = {
  ERROR: "destructive",
  WARNING: "warning",
  VALID: "success",
  PENDING: "secondary",
  COMMITTED: "secondary",
  SKIPPED: "secondary",
};

const parseTimelineRange = (
  windows: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  dayOfWeek: number,
) => {
  const dayWindows = windows.filter((window) => window.dayOfWeek === dayOfWeek);
  if (dayWindows.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  const startMinute = Math.min(
    ...dayWindows.map((window) => window.startMinute),
  );
  const endMinute = Math.max(...dayWindows.map((window) => window.endMinute));
  const startHour = Math.max(0, Math.floor(startMinute / 60));
  const endHour = Math.min(24, Math.ceil(endMinute / 60));

  if (endHour <= startHour) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  return { startHour, endHour };
};

const getMinuteOfDay = (instant: Date | string, timeZone: string) => {
  const zoned = getZonedDate(instant, timeZone);
  return zoned.getHours() * 60 + zoned.getMinutes();
};

const getEndMinuteForDayKey = (
  dayKey: string,
  instant: Date | string,
  timeZone: string,
) => {
  const endMinute = getMinuteOfDay(instant, timeZone);
  const endDayKey = getZonedDayKey(instant, timeZone);

  if (endDayKey !== dayKey && endMinute === 0) {
    return 24 * 60;
  }

  return endMinute;
};

const buildDateFromDayKey = (
  dayKey: string,
  startMinute: number,
  timeZone: string,
) => {
  const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  return addMinutes(dayStart, startMinute);
};

const formatDateTimeInput = (date: Date, timeZone: string) =>
  format(getZonedDate(date, timeZone), "yyyy-MM-dd'T'HH:mm");

const parseDateTimeInput = (value: string, timeZone: string) => {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  return new TZDate(year, month - 1, day, hour, minute, timeZone);
};

const blockTypeOptions = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "WALK_IN", label: "Walk-in" },
] as const;

const customBlockSchema = z.object({
  blockType: z.enum(["MAINTENANCE", "WALK_IN"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().trim().optional(),
});

type CustomBlockFormValues = z.infer<typeof customBlockSchema>;

export default function OwnerAvailabilityStudioPage() {
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

  const todayDayKey = React.useMemo(
    () => getZonedDayKey(getZonedToday(placeTimeZone), placeTimeZone),
    [placeTimeZone],
  );

  const visibleDayKeys = React.useMemo(() => {
    if (isWeekView) return weekDayKeys;
    return [dayKey];
  }, [dayKey, isWeekView, weekDayKeys]);

  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    () => selectedDate,
  );
  React.useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

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

    const ranges = weekDayKeys.map((dayKey) => {
      const dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
      const dayOfWeek = getZonedDate(dayStart, placeTimeZone).getDay();
      return parseTimelineRange(windows, dayOfWeek);
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

    for (const dayKey of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
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
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { block, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dayKey, items);
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

    for (const dayKey of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
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
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { reservation: res, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dayKey, items);
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

    for (const dayKey of weekDayKeys) {
      const dayStart = getZonedDayRangeFromDayKey(dayKey, placeTimeZone).start;
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
          const height =
            ((clampedEnd - clampedStart) / 60) * TIMELINE_ROW_HEIGHT;

          if (height <= 0) return null;

          return { row, topOffset, height };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      byDayKey.set(dayKey, items);
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

  const pendingRangeUpdates = React.useRef<
    Map<string, { startTime: string; endTime: string; version: number }>
  >(new Map());
  const rangeUpdateVersions = React.useRef<Map<string, number>>(new Map());
  const debouncedFlushByBlock = React.useRef<
    Map<string, ReturnType<typeof debounce>>
  >(new Map());

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

  const [pendingRemoveBlockId, setPendingRemoveBlockId] = React.useState<
    string | null
  >(null);

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
    [cancelBlock],
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
  }, [cancelBlock, pendingRemoveBlockId]);

  // Guest booking state
  const [guestBookingOpen, setGuestBookingOpen] = React.useState(false);
  const [, setGuestBookingTimes] = React.useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const guestBookingFormSchema = z.object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    guestMode: z.enum(["existing", "new"]),
    guestProfileId: z.string().optional(),
    newGuestName: z.string().optional(),
    newGuestPhone: z.string().optional(),
    newGuestEmail: z.string().optional(),
    notes: z.string().optional(),
  });
  type GuestBookingFormValues = z.infer<typeof guestBookingFormSchema>;

  const guestBookingForm = useForm<GuestBookingFormValues>({
    resolver: zodResolver(guestBookingFormSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      guestMode: "new",
      guestProfileId: "",
      newGuestName: "",
      newGuestPhone: "",
      newGuestEmail: "",
      notes: "",
    },
  });

  const guestProfilesQuery = trpc.guestProfile.list.useQuery(
    { organizationId: organization?.id ?? "", limit: 50 },
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

  const openGuestBookingDialog = React.useCallback(
    (start: Date, end: Date) => {
      setGuestBookingTimes({ start, end });
      guestBookingForm.reset({
        startTime: formatDateTimeInput(start, placeTimeZone),
        endTime: formatDateTimeInput(end, placeTimeZone),
        guestMode: "new",
        guestProfileId: "",
        newGuestName: "",
        newGuestPhone: "",
        newGuestEmail: "",
        notes: "",
      });
      setGuestBookingOpen(true);
    },
    [guestBookingForm, placeTimeZone],
  );

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
        setGuestBookingOpen(false);
        setGuestBookingTimes(null);
      } catch (error) {
        toast.error("Unable to add guest booking", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      courtId,
      createGuestBooking,
      createGuestProfile,
      organization?.id,
      placeTimeZone,
    ],
  );

  const createBlock = React.useCallback(
    async (preset: BlockPreset, startTime: Date, endTime: Date) => {
      if (!courtId) {
        toast.error("Select a court first");
        return;
      }

      // Guest booking presets open a dialog instead of creating directly
      if (preset.blockType === "GUEST_BOOKING") {
        openGuestBookingDialog(startTime, endTime);
        return;
      }

      try {
        const payload = {
          courtId,
          startTime: toUtcISOString(startTime),
          endTime: toUtcISOString(endTime),
        };
        const created =
          preset.blockType === "MAINTENANCE"
            ? await createMaintenance.mutateAsync(payload)
            : await createWalkIn.mutateAsync(payload);

        toast.success("Block created", {
          description: `${preset.label} at ${formatInTimeZone(
            startTime,
            placeTimeZone,
            "h:mm a",
          )}`,
          action: {
            label: "Undo",
            onClick: () =>
              void handleCancelBlock(created.id, {
                skipConfirm: true,
                silent: true,
              }),
          },
        });
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
      handleCancelBlock,
      openGuestBookingDialog,
      placeTimeZone,
    ],
  );

  const handleUpdateBlockRange = React.useCallback(
    (blockId: string, startTime: Date, endTime: Date) => {
      if (endTime <= startTime) {
        toast.error("End time must be after start time");
        return;
      }

      const startIso = toUtcISOString(startTime);
      const endIso = toUtcISOString(endTime);

      // Immediate optimistic cache update
      utils.courtBlock.listForCourtRange.setData(
        blocksQueryInput,
        (old) =>
          old?.map((block) =>
            block.id === blockId
              ? { ...block, startTime: startIso, endTime: endIso }
              : block,
          ) ?? [],
      );

      // Track latest values with versioning
      const nextVersion = (rangeUpdateVersions.current.get(blockId) ?? 0) + 1;
      rangeUpdateVersions.current.set(blockId, nextVersion);
      pendingRangeUpdates.current.set(blockId, {
        startTime: startIso,
        endTime: endIso,
        version: nextVersion,
      });

      // Debounced save (per block)
      if (!isOptimisticBlockId(blockId)) {
        scheduleRangeFlush(blockId);
      }
    },
    [blocksQueryInput, scheduleRangeFlush, utils],
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

  // Navigation handlers for week and month views
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

  const [activeDragItem, setActiveDragItem] = React.useState<DragPreset | null>(
    null,
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  // Motion: reduced motion support
  const shouldReduceMotion = useReducedMotion();
  const viewTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const };

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragPreset | undefined;
    if (data?.kind === "preset") {
      setActiveDragItem(data);
    }
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!over) return;

      const activeData = active.data.current as DragItem | undefined;
      const overData = over.data.current as TimelineCellData | undefined;

      if (!activeData || !overData || overData.kind !== "timeline-cell") {
        return;
      }

      if (activeData.kind === "preset") {
        const start = buildDateFromDayKey(
          overData.dayKey,
          overData.startMinute,
          placeTimeZone,
        );
        const end = addMinutes(start, activeData.preset.durationMinutes);
        await createBlock(activeData.preset, start, end);
        return;
      }

      if (activeData.kind === "block") {
        const block = activeBlocks.find(
          (item) => item.id === activeData.blockId,
        );
        if (!block) return;
        const durationMinutes = Math.max(
          differenceInMinutes(
            new Date(block.endTime),
            new Date(block.startTime),
          ),
          60,
        );
        const start = buildDateFromDayKey(
          overData.dayKey,
          overData.startMinute,
          placeTimeZone,
        );
        const end = addMinutes(start, durationMinutes);
        await handleUpdateBlockRange(block.id, start, end);
        return;
      }

      if (activeData.kind === "resize") {
        const block = activeBlocks.find(
          (item) => item.id === activeData.blockId,
        );
        if (!block) return;
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const nextTime = buildDateFromDayKey(
          overData.dayKey,
          overData.startMinute,
          placeTimeZone,
        );
        if (activeData.edge === "start") {
          await handleUpdateBlockRange(block.id, nextTime, endTime);
        } else {
          const adjustedEnd = addMinutes(nextTime, 60);
          await handleUpdateBlockRange(block.id, startTime, adjustedEnd);
        }
        return;
      }

      if (activeData.kind === "draft-row") {
        const row = draftRowsById.get(activeData.rowId);
        if (!row) return;
        await handleDraftRowDrop(row.id, overData.dayKey, overData.startMinute);
      }
    },
    [
      activeBlocks,
      createBlock,
      draftRowsById,
      handleDraftRowDrop,
      handleUpdateBlockRange,
      placeTimeZone,
    ],
  );

  const isCreatingBlock =
    createMaintenance.isPending ||
    createWalkIn.isPending ||
    createGuestBooking.isPending;
  const isDragDisabled = !courtId;
  const isDraftDragDisabled = !isImportEditable || !courtId;

  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
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
  }, [customForm, dayKey, placeTimeZone, timelineStartMinute]);

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
    [courtId, createMaintenance, createWalkIn, placeTimeZone],
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.bookings);
  };

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
      <div className="space-y-6">
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
                  {(job.committedRowCount ?? 0) > 0 && (
                    <div>
                      <span className="text-muted-foreground">Committed:</span>{" "}
                      <span className="font-medium">
                        {job.committedRowCount}
                      </span>
                    </div>
                  )}
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
                {!isImportEditable && job && (
                  <Badge variant="secondary">Status: {job.status}</Badge>
                )}
                {isImportEditable && job?.errorRowCount ? (
                  <Badge variant="warning">Fix errors to commit</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-6">
            <div className="min-w-[220px] space-y-2">
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
            <div className="min-w-[220px] space-y-2">
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
          onDragCancel={() => setActiveDragItem(null)}
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
                  <div className="space-y-6">
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
                        <div className="space-y-1">
                          <h3 className="text-sm font-heading font-semibold">
                            Block Palette
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Drag a preset onto the week grid to create a block.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {BLOCK_PRESETS.map((preset) => (
                            <BlockPresetCard
                              key={preset.id}
                              preset={preset}
                              disabled={isDragDisabled}
                            />
                          ))}
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
                        {isDragDisabled && (
                          <p className="text-xs text-muted-foreground">
                            Select a court to enable drag-and-drop.
                          </p>
                        )}
                        {isImportOverlay && (
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
                                {draftRowsSorted.length > 8 && (
                                  <p className="text-xs text-muted-foreground">
                                    Showing first 8 rows.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
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
                          {/* Day headers */}
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

                          {/* Week columns: time labels + 7 day columns with interactive blocks */}
                          <div
                            className="grid gap-x-0"
                            style={{
                              gridTemplateColumns:
                                "72px repeat(7, minmax(100px, 1fr))",
                            }}
                          >
                            {/* Time labels column */}
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

                            {/* 7 day columns */}
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
                              />
                            ))}
                          </div>
                          {blocksQuery.isLoading && (
                            <div className="absolute inset-0 rounded-lg bg-background/70 backdrop-blur-sm" />
                          )}
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
                  <div className="space-y-6">
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
                        <div className="space-y-1">
                          <h3 className="text-sm font-heading font-semibold">
                            Block Palette
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Drag a preset onto the timeline to create a block.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {BLOCK_PRESETS.map((preset) => (
                            <BlockPresetCard
                              key={preset.id}
                              preset={preset}
                              disabled={isDragDisabled}
                            />
                          ))}
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
                        {isDragDisabled && (
                          <p className="text-xs text-muted-foreground">
                            Select a court to enable drag-and-drop.
                          </p>
                        )}
                        {isImportOverlay && (
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
                                {draftRowsSorted.length > 8 && (
                                  <p className="text-xs text-muted-foreground">
                                    Showing first 8 rows. Open the import review
                                    for full list.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
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
                                {hours.map((hour) => (
                                  <TimelineDropRow
                                    key={`row-${hour}`}
                                    dayKey={dayKey}
                                    startMinute={hour * 60}
                                    disabled={isDragDisabled}
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
                          {blocksQuery.isLoading && (
                            <div className="absolute inset-0 rounded-lg bg-background/70 backdrop-blur-sm" />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
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
                                  {block.reason && (
                                    <p className="text-xs text-muted-foreground">
                                      {block.reason}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {block.type === "WALK_IN" && (
                                    <span className="text-sm font-semibold">
                                      {formatCurrency(
                                        block.totalPriceCents,
                                        block.currency,
                                      )}
                                    </span>
                                  )}
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

          <DragOverlay>
            {activeDragItem?.kind === "preset" ? (
              <BlockPresetPreview preset={activeDragItem.preset} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <AlertDialog
          open={pendingRemoveBlockId !== null}
          onOpenChange={(open) => {
            if (!open) setPendingRemoveBlockId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove block</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the block from the schedule.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveBlock}
                className={buttonVariants({ variant: "destructive" })}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create custom block</DialogTitle>
              <DialogDescription>
                Times are shown in {placeTimeZone}. Blocks must align to full
                hours.
              </DialogDescription>
            </DialogHeader>
            <StandardFormProvider
              form={customForm}
              onSubmit={handleCustomSubmit}
            >
              <StandardFormSelect<CustomBlockFormValues>
                name="blockType"
                label="Block type"
                options={blockTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                required
              />
              <StandardFormInput<CustomBlockFormValues>
                name="startTime"
                label="Start time"
                type="datetime-local"
                required
              />
              <StandardFormInput<CustomBlockFormValues>
                name="endTime"
                label="End time"
                type="datetime-local"
                required
              />
              <StandardFormTextarea<CustomBlockFormValues>
                name="reason"
                label="Reason (optional)"
                placeholder="Net replacement"
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCustomDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingBlock}>
                  {isCreatingBlock ? "Creating..." : "Create block"}
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          </DialogContent>
        </Dialog>

        <Dialog
          open={guestBookingOpen}
          onOpenChange={(open) => {
            setGuestBookingOpen(open);
            if (!open) setGuestBookingTimes(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add guest booking</DialogTitle>
              <DialogDescription>
                Create a confirmed reservation for a guest. Pricing is computed
                from your schedule in {placeTimeZone}.
              </DialogDescription>
            </DialogHeader>
            <StandardFormProvider
              form={guestBookingForm}
              onSubmit={handleGuestBookingSubmit}
            >
              <div className="space-y-4">
                <StandardFormInput<GuestBookingFormValues>
                  name="startTime"
                  label="Start time"
                  type="datetime-local"
                  required
                />
                <StandardFormInput<GuestBookingFormValues>
                  name="endTime"
                  label="End time"
                  type="datetime-local"
                  required
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Guest</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        guestBookingForm.watch("guestMode") === "existing"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        guestBookingForm.setValue("guestMode", "existing")
                      }
                    >
                      Select existing
                    </Button>
                    <Button
                      type="button"
                      variant={
                        guestBookingForm.watch("guestMode") === "new"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        guestBookingForm.setValue("guestMode", "new")
                      }
                    >
                      Create new
                    </Button>
                  </div>
                </div>

                {guestBookingForm.watch("guestMode") === "existing" ? (
                  <StandardFormSelect<GuestBookingFormValues>
                    name="guestProfileId"
                    label="Select guest"
                    placeholder="Choose a guest..."
                    emptyOptionLabel="Choose a guest..."
                    options={(guestProfilesQuery.data ?? []).map((guest) => ({
                      value: guest.id,
                      label: `${guest.displayName}${guest.phoneNumber ? ` (${guest.phoneNumber})` : ""}`,
                    }))}
                    required
                  />
                ) : (
                  <>
                    <StandardFormInput<GuestBookingFormValues>
                      name="newGuestName"
                      label="Guest name"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                    <StandardFormInput<GuestBookingFormValues>
                      name="newGuestPhone"
                      label="Phone (optional)"
                      placeholder="09171234567"
                    />
                    <StandardFormInput<GuestBookingFormValues>
                      name="newGuestEmail"
                      label="Email (optional)"
                      placeholder="guest@example.com"
                    />
                  </>
                )}

                <StandardFormTextarea<GuestBookingFormValues>
                  name="notes"
                  label="Notes (optional)"
                  placeholder="Internal notes"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setGuestBookingOpen(false);
                    setGuestBookingTimes(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createGuestBooking.isPending || createGuestProfile.isPending
                  }
                >
                  Save guest booking
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

const BlockPresetCard = React.memo(function BlockPresetCard({
  preset,
  disabled,
}: {
  preset: BlockPreset;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: preset.id,
      data: { kind: "preset", preset } satisfies DragPreset,
      disabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left transition-shadow",
        "hover:shadow-md",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab",
        isDragging ? "opacity-40" : "opacity-100",
      )}
      aria-disabled={disabled}
    >
      <BlockPresetContent preset={preset} />
    </button>
  );
});

const BlockPresetPreview = React.memo(function BlockPresetPreview({
  preset,
}: {
  preset: BlockPreset;
}) {
  return (
    <div className="w-64 rounded-lg border bg-card p-3 text-left shadow-lg">
      <BlockPresetContent preset={preset} />
    </div>
  );
});

const BlockPresetContent = React.memo(function BlockPresetContent({
  preset,
}: {
  preset: BlockPreset;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-heading font-semibold">{preset.label}</p>
        <p className="text-xs text-muted-foreground">{preset.description}</p>
      </div>
      <Badge variant={preset.badgeVariant}>
        {formatDuration(preset.durationMinutes)}
      </Badge>
    </div>
  );
});

const TimelineDropRow = React.memo(function TimelineDropRow({
  dayKey,
  startMinute,
  disabled,
}: {
  dayKey: string;
  startMinute: number;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-cell-${dayKey}-${startMinute}`,
    data: {
      kind: "timeline-cell",
      dayKey,
      startMinute,
    } satisfies TimelineCellData,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-[56px] rounded-md border-t border-border/70 transition-colors",
        "bg-card",
        isOver && !disabled && "ring-2 ring-primary/30 ring-inset bg-primary/5",
      )}
    />
  );
});

const TimelineBlockItem = React.memo(function TimelineBlockItem({
  block,
  topOffset,
  height,
  timeZone,
  disabled,
  isPending,
  isPastDay,
  compact,
  onRemove,
}: {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
  timeZone: string;
  disabled: boolean;
  isPending?: boolean;
  isPastDay?: boolean;
  compact?: boolean;
  onRemove?: (blockId: string) => void;
}) {
  const effectiveDisabled = disabled;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `block-${block.id}`,
      data: { kind: "block", blockId: block.id } satisfies DragBlock,
      disabled: effectiveDisabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isWalkIn = block.type === "WALK_IN";
  const durationMinutes = Math.max(
    getMinuteOfDay(block.endTime, timeZone) -
      getMinuteOfDay(block.startTime, timeZone),
    0,
  );

  return (
    <div
      ref={setNodeRef}
      style={{ top: topOffset, height, ...style }}
      {...attributes}
      className={cn(
        "pointer-events-auto absolute rounded-lg border bg-card text-card-foreground shadow-sm",
        compact
          ? "left-0.5 right-0.5 border-l-2 px-1 py-0.5"
          : "left-1 right-1 border-l-4 px-3 py-2",
        isWalkIn ? "border-l-primary" : "border-l-amber-500",
        "group",
        effectiveDisabled ? "cursor-not-allowed" : "cursor-grab",
        isDragging && "opacity-50",
        isPending && "opacity-80",
        isPastDay && "opacity-50 saturate-50",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-1",
          compact ? "gap-0.5" : "gap-2",
        )}
        {...listeners}
      >
        {compact ? (
          <span
            className={cn(
              "text-[10px] font-semibold truncate",
              isWalkIn ? "text-primary" : "text-amber-600",
            )}
          >
            {isWalkIn ? "W" : "M"}
          </span>
        ) : (
          <Badge
            variant={isWalkIn ? "paid" : "warning"}
            className="text-[10px] px-1.5 py-0"
          >
            {isWalkIn ? "Walk-in" : "Maintenance"}
          </Badge>
        )}
        {!compact && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(durationMinutes)}
          </span>
        )}
      </div>
      {!compact && (
        <div className="mt-1 text-xs font-medium">
          {formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)}
        </div>
      )}
      {compact && (
        <div className="text-[9px] text-muted-foreground truncate">
          {formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)}
        </div>
      )}
      {!compact && block.reason && (
        <div className="text-[11px] text-muted-foreground truncate">
          {block.reason}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove block"
          className={cn(
            "pointer-events-auto absolute z-10 flex items-center justify-center rounded-full",
            "bg-destructive/90 text-destructive-foreground shadow-sm",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 touch:opacity-100",
            "transition-opacity duration-150",
            "hover:bg-destructive",
            compact ? "-right-1.5 -top-1.5 h-4 w-4" : "-right-2 -top-2 h-5 w-5",
          )}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
        >
          <X className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
      <ResizeHandle
        blockId={block.id}
        edge="start"
        disabled={effectiveDisabled}
      />
      <ResizeHandle
        blockId={block.id}
        edge="end"
        disabled={effectiveDisabled}
      />
    </div>
  );
});

const ResizeHandle = React.memo(function ResizeHandle({
  blockId,
  edge,
  disabled,
}: {
  blockId: string;
  edge: "start" | "end";
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${edge}-${blockId}`,
    data: { kind: "resize", blockId, edge } satisfies DragResizeHandle,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "absolute left-2 right-2 h-2 rounded-full transition-opacity",
        // Hidden by default, visible on hover/focus
        "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        "bg-foreground/20 hover:bg-foreground/40",
        edge === "start" ? "top-1" : "bottom-1",
        disabled ? "cursor-not-allowed" : "cursor-ns-resize",
        isDragging && "opacity-60",
      )}
      aria-hidden
    />
  );
});

const DraftTimelineBlock = React.memo(function DraftTimelineBlock({
  row,
  topOffset,
  height,
  timeZone,
}: {
  row: DraftRowItem;
  topOffset: number;
  height: number;
  timeZone: string;
}) {
  const status = (row.status ?? "PENDING") as DraftRowStatus;
  const statusBadge = DRAFT_STATUS_BADGE[status] ?? "secondary";
  const startTime = row.startTime as Date | string | null;
  const endTime = row.endTime as Date | string | null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-2 right-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-foreground",
        status === "ERROR"
          ? "border-destructive/30"
          : status === "WARNING"
            ? "border-amber-400/30"
            : "border-primary/30",
      )}
      style={{ top: topOffset, height }}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase">
        <span>Draft · Row {row.lineNumber}</span>
        <Badge variant={statusBadge}>{status.toLowerCase()}</Badge>
      </div>
      {startTime && endTime && (
        <div className="text-xs">
          {formatTimeRangeInTimeZone(startTime, endTime, timeZone)}
        </div>
      )}
      {row.courtLabel && (
        <div className="text-[11px] opacity-70 truncate">
          Court: {row.courtLabel}
        </div>
      )}
    </div>
  );
});

const DraftRowCard = React.memo(function DraftRowCard({
  row,
  timeZone,
  disabled,
  selectedCourt,
}: {
  row: DraftRowItem;
  timeZone: string;
  disabled: boolean;
  selectedCourt: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draft-row-${row.id}`,
      data: { kind: "draft-row", rowId: row.id } satisfies DragDraftRow,
      disabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;
  const status = (row.status ?? "PENDING") as DraftRowStatus;
  const statusBadge = DRAFT_STATUS_BADGE[status] ?? "secondary";

  const startTime = row.startTime as Date | string | null;
  const endTime = row.endTime as Date | string | null;
  const timeLabel =
    startTime && endTime
      ? formatTimeRangeInTimeZone(startTime, endTime, timeZone)
      : "No time set";

  const errorHint = row.errors?.[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border bg-card p-3 text-left text-xs transition-shadow",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab",
        isDragging ? "opacity-40" : "opacity-100",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading font-semibold">Row {row.lineNumber}</span>
        <Badge variant={statusBadge}>{status.toLowerCase()}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{timeLabel}</p>
      {row.courtLabel && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Court: {row.courtLabel}
        </p>
      )}
      {!row.courtLabel && selectedCourt && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Drop to assign {selectedCourt}
        </p>
      )}
      {errorHint && (
        <p className="mt-1 text-[11px] text-destructive">{errorHint}</p>
      )}
    </div>
  );
});

const WeekDayColumn = React.memo(function WeekDayColumn({
  dayKey,
  hours,
  blocks,
  draftBlocks,
  reservations,
  timeZone,
  disabled,
  isPastDay,
  pendingBlockIds,
  onRemoveBlock,
}: {
  dayKey: string;
  hours: number[];
  blocks: Array<{ block: CourtBlockItem; topOffset: number; height: number }>;
  draftBlocks: Array<{
    row: DraftRowItem;
    topOffset: number;
    height: number;
  }>;
  reservations: Array<{
    reservation: ReservationItem;
    topOffset: number;
    height: number;
  }>;
  timeZone: string;
  disabled: boolean;
  isPastDay?: boolean;
  pendingBlockIds: Set<string>;
  onRemoveBlock?: (blockId: string) => void;
}) {
  return (
    <div
      className={cn(
        "relative border-l border-border/70",
        isPastDay && "bg-muted/40",
      )}
    >
      {/* Droppable hour rows */}
      <div className="space-y-0">
        {hours.map((hour) => (
          <TimelineDropRow
            key={`week-drop-${dayKey}-${hour}`}
            dayKey={dayKey}
            startMinute={hour * 60}
            disabled={disabled}
          />
        ))}
      </div>
      {/* Interactive block overlays */}
      <div className="pointer-events-none absolute inset-0">
        {blocks.map(({ block, topOffset, height }) => (
          <TimelineBlockItem
            key={block.id}
            block={block}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
            disabled={disabled}
            isPending={pendingBlockIds.has(block.id)}
            isPastDay={isPastDay}
            compact
            onRemove={onRemoveBlock}
          />
        ))}
        {draftBlocks.map(({ row, topOffset, height }) => (
          <DraftTimelineBlock
            key={`draft-${row.id}`}
            row={row}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
          />
        ))}
        {reservations.map(({ reservation, topOffset, height }) => (
          <TimelineReservationItem
            key={`res-${reservation.id}`}
            reservation={reservation}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
            compact
          />
        ))}
      </div>
    </div>
  );
});

const TimelineReservationItem = React.memo(function TimelineReservationItem({
  reservation,
  topOffset,
  height,
  timeZone,
  compact,
}: {
  reservation: ReservationItem;
  topOffset: number;
  height: number;
  timeZone: string;
  compact?: boolean;
}) {
  const isGuest = Boolean(reservation.guestProfileId);
  const label =
    reservation.playerNameSnapshot ?? (isGuest ? "Guest" : "Player");
  const statusLabel =
    reservation.status === "CONFIRMED"
      ? "Confirmed"
      : reservation.status === "CREATED"
        ? "Pending"
        : reservation.status;

  return (
    <div
      style={{ top: topOffset, height }}
      className={cn(
        "pointer-events-auto absolute rounded-lg border bg-card/90 text-card-foreground shadow-sm",
        compact
          ? "left-0.5 right-0.5 border-l-2 px-1 py-0.5"
          : "left-1 right-1 border-l-4 px-3 py-2",
        "border-l-emerald-500",
        "cursor-default",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between",
          compact ? "gap-0.5" : "gap-2",
        )}
      >
        {compact ? (
          <span className="text-[10px] font-semibold truncate text-emerald-600">
            R
          </span>
        ) : (
          <Badge variant="success" className="text-[10px] px-1.5 py-0">
            {statusLabel}
          </Badge>
        )}
        {!compact && reservation.totalPriceCents > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatCurrency(reservation.totalPriceCents, reservation.currency)}
          </span>
        )}
      </div>
      {!compact && (
        <div className="mt-1 text-xs font-medium">
          {formatTimeRangeInTimeZone(
            reservation.startTime,
            reservation.endTime,
            timeZone,
          )}
        </div>
      )}
      {compact && (
        <div className="text-[9px] text-muted-foreground truncate">
          {formatTimeRangeInTimeZone(
            reservation.startTime,
            reservation.endTime,
            timeZone,
          )}
        </div>
      )}
      <div
        className={cn(
          "truncate",
          compact
            ? "text-[9px] text-muted-foreground"
            : "text-[11px] text-muted-foreground",
        )}
      >
        {label}
      </div>
    </div>
  );
});
