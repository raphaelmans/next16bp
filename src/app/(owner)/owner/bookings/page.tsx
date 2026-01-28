"use client";

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
import { addMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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

type TimelineCellData = {
  kind: "timeline-cell";
  dayKey: string;
  startMinute: number;
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

export default function OwnerBookingsPlaygroundPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { placeId, setPlaceId } = useOwnerPlaceFilter({
    storageKey: "owner.bookingsPlayground.placeId",
  });
  const { courtId, setCourtId } = useOwnerCourtFilter({
    storageKey: "owner.bookingsPlayground.courtId",
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

  const [dayKeyParam, setDayKeyParam] = useQueryState(
    "dayKey",
    parseAsString.withOptions({ history: "replace" }),
  );

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

  const selectedDayRange = React.useMemo(
    () => getZonedDayRangeFromDayKey(dayKey, placeTimeZone),
    [dayKey, placeTimeZone],
  );
  const selectedDate = selectedDayRange.start;
  const selectedDayLabel = React.useMemo(
    () => formatInTimeZone(selectedDate, placeTimeZone, "EEEE, MMMM d, yyyy"),
    [placeTimeZone, selectedDate],
  );

  const [calendarMonth, setCalendarMonth] = React.useState(selectedDate);
  React.useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

  const courtHoursQuery = useCourtHours(courtId);
  const dayOfWeek = selectedDate.getDay();
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
    () => toUtcISOString(selectedDayRange.start),
    [selectedDayRange.start],
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
    () => (blocksQuery.data ?? []).filter((block) => block.isActive),
    [blocksQuery.data],
  );

  const dayBlocks = React.useMemo(
    () =>
      [...activeBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime)),
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

  const utils = trpc.useUtils();
  const createMaintenance = trpc.courtBlock.createMaintenance.useMutation();
  const createWalkIn = trpc.courtBlock.createWalkIn.useMutation();
  const cancelBlock = trpc.courtBlock.cancel.useMutation();

  const invalidateBlocks = React.useCallback(() => {
    void utils.courtBlock.listForCourtRange.invalidate();
  }, [utils]);

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

      const activeData = active.data.current as DragPreset | undefined;
      const overData = over.data.current as TimelineCellData | undefined;

      if (!activeData || activeData.kind !== "preset") return;
      if (!overData || overData.kind !== "timeline-cell") return;

      const start = buildDateFromDayKey(
        overData.dayKey,
        overData.startMinute,
        placeTimeZone,
      );
      const end = addMinutes(start, activeData.preset.durationMinutes);
      await createBlock(activeData.preset, start, end);
    },
    [createBlock, placeTimeZone],
  );

  const isDragDisabled =
    !courtId || createMaintenance.isPending || createWalkIn.isPending;

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
            Bookings Playground
          </h1>
          <p className="text-sm text-muted-foreground">
            Drag block presets onto the timeline to manage daily availability.
          </p>
        </div>

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
                  </div>
                  {isDragDisabled && (
                    <p className="text-xs text-muted-foreground">
                      Select a court to enable drag-and-drop.
                    </p>
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
                            ({ block, topOffset, height }) => {
                              const isWalkIn = block.type === "WALK_IN";
                              return (
                                <div
                                  key={block.id}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-lg border px-3 py-2 shadow-sm",
                                    isWalkIn
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-700",
                                  )}
                                  style={{ top: topOffset, height }}
                                >
                                  <div className="flex items-center justify-between text-xs font-semibold uppercase">
                                    <span>
                                      {isWalkIn ? "Walk-in" : "Maintenance"}
                                    </span>
                                    <span>
                                      {formatDuration(
                                        getMinuteOfDay(
                                          block.endTime,
                                          placeTimeZone,
                                        ) -
                                          getMinuteOfDay(
                                            block.startTime,
                                            placeTimeZone,
                                          ) || 0,
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    {formatTimeRangeInTimeZone(
                                      block.startTime,
                                      block.endTime,
                                      placeTimeZone,
                                    )}
                                  </div>
                                  {block.reason && (
                                    <div className="text-[11px] opacity-70 truncate">
                                      {block.reason}
                                    </div>
                                  )}
                                </div>
                              );
                            },
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
              <BlockPresetCard
                preset={activeDragItem.preset}
                disabled
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppShell>
  );
}

function BlockPresetCard({
  preset,
  disabled,
  isOverlay,
}: {
  preset: BlockPreset;
  disabled?: boolean;
  isOverlay?: boolean;
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
        isDragging && !isOverlay ? "opacity-40" : "opacity-100",
        isOverlay ? "shadow-lg" : "shadow-sm",
      )}
      aria-disabled={disabled}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-heading font-semibold">{preset.label}</p>
          <p className="text-xs text-muted-foreground">{preset.description}</p>
        </div>
        <Badge variant={preset.badgeVariant}>
          {formatDuration(preset.durationMinutes)}
        </Badge>
      </div>
    </button>
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
