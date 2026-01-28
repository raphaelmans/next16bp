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
import { addMinutes, differenceInMinutes, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type BlockPreset = {
  id: string;
  label: string;
  blockType: "MAINTENANCE" | "WALK_IN";
  durationMinutes: number;
  badgeVariant: "warning" | "paid";
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
  type: "MAINTENANCE" | "WALK_IN";
  startTime: Date | string;
  endTime: Date | string;
  reason: string | null;
  totalPriceCents: number;
  currency: string;
  isActive: boolean;
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
    id: "preset-maintenance-60",
    label: "1h Maintenance",
    blockType: "MAINTENANCE",
    durationMinutes: 60,
    badgeVariant: "warning",
    description: "Block for repairs or private events.",
  },
  {
    id: "preset-maintenance-120",
    label: "2h Maintenance",
    blockType: "MAINTENANCE",
    durationMinutes: 120,
    badgeVariant: "warning",
    description: "Extended maintenance window.",
  },
  {
    id: "preset-walkin-60",
    label: "1h Walk-in",
    blockType: "WALK_IN",
    durationMinutes: 60,
    badgeVariant: "paid",
    description: "Reserve for walk-in customers.",
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
  const [jobIdParam, setJobIdParam] = useQueryState(
    "jobId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const jobId = jobIdParam ?? "";

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

  const [calendarMonth, setCalendarMonth] = React.useState<Date>(selectedDate);
  React.useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

  const courtHoursQuery = useCourtHours(courtId);
  const dayOfWeek = getZonedDate(selectedDayStart, placeTimeZone).getDay();
  const { startHour, endHour } = React.useMemo(
    () => parseTimelineRange(courtHoursQuery.data ?? [], dayOfWeek),
    [courtHoursQuery.data, dayOfWeek],
  );

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

  const dayStartIso = React.useMemo(
    () => toUtcISOString(selectedDayStart),
    [selectedDayStart],
  );
  const dayEndIso = React.useMemo(
    () => toUtcISOString(selectedDayRange.end),
    [selectedDayRange.end],
  );

  const blocksQuery = trpc.courtBlock.listForCourtRange.useQuery(
    { courtId, startTime: dayStartIso, endTime: dayEndIso },
    { enabled: Boolean(courtId) },
  );

  const activeBlocks = React.useMemo(
    () =>
      ((blocksQuery.data ?? []) as CourtBlockItem[]).filter(
        (block) => block.isActive,
      ),
    [blocksQuery.data],
  );

  const dayBlocks = React.useMemo(
    () =>
      [...activeBlocks].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [activeBlocks],
  );

  const timelineBlocks = React.useMemo(() => {
    return activeBlocks
      .map((block) => {
        const startMinute = getMinuteOfDay(block.startTime, placeTimeZone);
        const endMinute = getMinuteOfDay(block.endTime, placeTimeZone);

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
  }, [activeBlocks, placeTimeZone, timelineEndMinute, timelineStartMinute]);

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
        const startTime = row.startTime as Date | string;
        const endTime = row.endTime as Date | string;
        const startMinute = getMinuteOfDay(startTime, placeTimeZone);
        const endMinute = getMinuteOfDay(endTime, placeTimeZone);
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
    draftRows,
    isImportOverlay,
    placeTimeZone,
    timelineEndMinute,
    timelineStartMinute,
  ]);

  const utils = trpc.useUtils();
  const createMaintenance = trpc.courtBlock.createMaintenance.useMutation();
  const createWalkIn = trpc.courtBlock.createWalkIn.useMutation();
  const cancelBlock = trpc.courtBlock.cancel.useMutation();
  const updateRange = trpc.courtBlock.updateRange.useMutation();

  const updateDraftRow = trpc.bookingsImport.updateRow.useMutation();
  const commitImport = trpc.bookingsImport.commit.useMutation();
  const discardImport = trpc.bookingsImport.discardJob.useMutation();

  const invalidateBlocks = React.useCallback(() => {
    void utils.courtBlock.listForCourtRange.invalidate();
  }, [utils]);

  const invalidateDraftRows = React.useCallback(() => {
    if (!jobId) return;
    void utils.bookingsImport.listRows.invalidate({ jobId });
    void utils.bookingsImport.getJob.invalidate({ jobId });
  }, [jobId, utils]);

  const handleCancelBlock = React.useCallback(
    async (
      blockId: string,
      options?: { skipConfirm?: boolean; silent?: boolean },
    ) => {
      if (!options?.skipConfirm) {
        const confirmed = window.confirm("Remove this block?");
        if (!confirmed) return;
      }

      try {
        await cancelBlock.mutateAsync({ blockId });
        invalidateBlocks();
        if (!options?.silent) {
          toast.success("Block removed");
        }
      } catch (error) {
        toast.error("Unable to remove block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [cancelBlock, invalidateBlocks],
  );

  const createBlock = React.useCallback(
    async (preset: BlockPreset, startTime: Date, endTime: Date) => {
      if (!courtId) {
        toast.error("Select a court first");
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

        invalidateBlocks();
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
      invalidateBlocks,
      placeTimeZone,
    ],
  );

  const handleUpdateBlockRange = React.useCallback(
    async (blockId: string, startTime: Date, endTime: Date) => {
      if (endTime <= startTime) {
        toast.error("End time must be after start time");
        return;
      }

      try {
        await updateRange.mutateAsync({
          blockId,
          startTime: toUtcISOString(startTime),
          endTime: toUtcISOString(endTime),
        });
        invalidateBlocks();
      } catch (error) {
        toast.error("Unable to update block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [invalidateBlocks, updateRange],
  );

  const handleDraftRowDrop = React.useCallback(
    async (rowId: string, startMinute: number) => {
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
      const start = buildDateFromDayKey(dayKey, startMinute, placeTimeZone);
      const end = addMinutes(start, durationMinutes);

      try {
        await updateDraftRow.mutateAsync({
          rowId,
          startTime: start,
          endTime: end,
          courtId: selectedCourt?.id ?? undefined,
          courtLabel: selectedCourt?.label ?? undefined,
        });
        invalidateDraftRows();
        toast.success("Draft row updated");
      } catch (error) {
        toast.error("Unable to update draft row", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [
      dayKey,
      draftRowsById,
      invalidateDraftRows,
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
        await handleDraftRowDrop(row.id, overData.startMinute);
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

  const isCreatingBlock = createMaintenance.isPending || createWalkIn.isPending;
  const isDragDisabled = !courtId || isCreatingBlock || updateRange.isPending;
  const isDraftDragDisabled =
    !isImportEditable || !courtId || updateDraftRow.isPending;

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

        invalidateBlocks();
        toast.success("Block created");
        setCustomDialogOpen(false);
      } catch (error) {
        toast.error("Unable to create block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [courtId, createMaintenance, createWalkIn, invalidateBlocks, placeTimeZone],
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
                              Showing first 8 rows. Open the import review for
                              full list.
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
                      <div key={block.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Badge
                              variant={
                                block.type === "WALK_IN" ? "paid" : "warning"
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

          <DragOverlay>
            {activeDragItem?.kind === "preset" ? (
              <BlockPresetPreview preset={activeDragItem.preset} />
            ) : null}
          </DragOverlay>
        </DndContext>

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
      </div>
    </AppShell>
  );
}

function BlockPresetCard({
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
}

function BlockPresetPreview({ preset }: { preset: BlockPreset }) {
  return (
    <div className="w-64 rounded-lg border bg-card p-3 text-left shadow-lg">
      <BlockPresetContent preset={preset} />
    </div>
  );
}

function BlockPresetContent({ preset }: { preset: BlockPreset }) {
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
}

function TimelineDropRow({
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
        isOver && !disabled ? "bg-primary/10 border-primary/40" : "",
      )}
    />
  );
}

function TimelineBlockItem({
  block,
  topOffset,
  height,
  timeZone,
  disabled,
}: {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
  timeZone: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `block-${block.id}`,
      data: { kind: "block", blockId: block.id } satisfies DragBlock,
      disabled,
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
        "pointer-events-auto absolute left-1 right-1 rounded-lg border px-3 py-2 shadow-sm",
        isWalkIn
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700",
        disabled ? "cursor-not-allowed" : "cursor-grab",
        isDragging ? "opacity-50" : "opacity-100",
      )}
    >
      <div
        className="flex items-center justify-between text-xs font-semibold uppercase"
        {...listeners}
      >
        <span>{isWalkIn ? "Walk-in" : "Maintenance"}</span>
        <span>{formatDuration(durationMinutes)}</span>
      </div>
      <div className="text-xs">
        {formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)}
      </div>
      {block.reason && (
        <div className="text-[11px] opacity-70 truncate">{block.reason}</div>
      )}
      <ResizeHandle blockId={block.id} edge="start" disabled={disabled} />
      <ResizeHandle blockId={block.id} edge="end" disabled={disabled} />
    </div>
  );
}

function ResizeHandle({
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
        "absolute left-2 right-2 h-2 rounded-full bg-foreground/30",
        edge === "start" ? "top-1" : "bottom-1",
        disabled ? "cursor-not-allowed" : "cursor-ns-resize",
        isDragging ? "opacity-60" : "opacity-100",
      )}
      aria-hidden
    />
  );
}

function DraftTimelineBlock({
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
        "pointer-events-none absolute left-2 right-2 rounded-lg border border-dashed px-3 py-2",
        status === "ERROR"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : status === "WARNING"
            ? "border-amber-400/40 bg-amber-100/60 text-amber-700"
            : "border-primary/30 bg-primary/5 text-primary",
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
}

function DraftRowCard({
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
}
