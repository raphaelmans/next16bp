"use client";

import { TZDate } from "@date-fns/tz";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  addMinutes,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { Loader2, Minus, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AvailabilityEmptyState } from "@/components/availability-empty-state";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormTextarea,
} from "@/components/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import { useOwnerOrganization } from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import {
  AvailabilityMonthView,
  type TimeSlot,
} from "@/shared/components/kudos";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { MAX_BOOKING_WINDOW_DAYS } from "@/shared/lib/booking-window";
import { formatCurrency, formatTimeRangeInTimeZone } from "@/shared/lib/format";
import {
  getZonedDate,
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedDayRangeFromDayKey,
  getZonedToday,
  toUtcISOString,
} from "@/shared/lib/time-zone";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 24;
const DEFAULT_DURATION_MINUTES = 60;
const clampDurationHours = (value: number) =>
  Math.min(Math.max(Math.round(value), MIN_DURATION_HOURS), MAX_DURATION_HOURS);

type MonthDayAvailability = {
  dayKey: string;
  date: Date;
  slots: TimeSlot[];
};

function parseDayKeyToDate(dayKey: string, timeZone?: string) {
  const range = getZonedDayRangeFromDayKey(dayKey, timeZone);
  return range.start;
}

function buildAvailabilityId(
  courtId: string,
  startTime: string,
  duration: number,
) {
  return `${courtId}-${startTime}-${duration}`;
}

const blockFormSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().optional(),
});

type BlockFormValues = z.infer<typeof blockFormSchema>;

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

export default function OwnerCourtAvailabilityPage() {
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

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.availability(placeId, courtId),
    );
  };

  const placeTimeZone = placeData?.place.timeZone ?? "Asia/Manila";
  const today = React.useMemo(
    () => getZonedToday(placeTimeZone),
    [placeTimeZone],
  );
  const todayRange = React.useMemo(
    () => getZonedDayRangeForInstant(today, placeTimeZone),
    [placeTimeZone, today],
  );
  const maxDate = React.useMemo(
    () => addDays(today, MAX_BOOKING_WINDOW_DAYS),
    [today],
  );
  const minMonthStart = React.useMemo(() => startOfMonth(today), [today]);
  const maxMonthStart = React.useMemo(() => startOfMonth(maxDate), [maxDate]);

  const [selectedDate, setSelectedDate] = React.useState<Date>(today);
  const [isDateInitialized, setIsDateInitialized] = React.useState(false);
  React.useEffect(() => {
    if (isDateInitialized) return;
    setSelectedDate(today);
    setIsDateInitialized(true);
  }, [isDateInitialized, today]);

  const [monthStart, setMonthStart] = React.useState<Date>(startOfMonth(today));
  const [isMonthInitialized, setIsMonthInitialized] = React.useState(false);
  React.useEffect(() => {
    if (isMonthInitialized) return;
    setMonthStart(startOfMonth(today));
    setIsMonthInitialized(true);
  }, [isMonthInitialized, today]);

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

  const [durationMinutes, setDurationMinutes] = React.useState(
    DEFAULT_DURATION_MINUTES,
  );
  const durationHours = durationMinutes / 60;
  const [durationHoursDraft, setDurationHoursDraft] = React.useState(
    String(durationHours),
  );
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>();
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);
  const [walkInOpen, setWalkInOpen] = React.useState(false);
  const [walkInPreset, setWalkInPreset] = React.useState<TimeSlot | null>(null);
  const [maintenancePreset, setMaintenancePreset] =
    React.useState<TimeSlot | null>(null);

  const maintenanceForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: { startTime: "", endTime: "", reason: "" },
  });
  const walkInForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: { startTime: "", endTime: "", reason: "" },
  });

  const commitDurationHours = React.useCallback(
    (hours: number) => {
      const clampedHours = clampDurationHours(hours);
      const nextMinutes = clampedHours * 60;
      if (nextMinutes !== durationMinutes) {
        setDurationMinutes(nextMinutes);
        setSelectedSlotId(undefined);
      }
      setDurationHoursDraft(String(clampedHours));
    },
    [durationMinutes],
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

  const utils = trpc.useUtils();

  const defaultRange = React.useMemo(() => {
    const start = getZonedDate(selectedDate, placeTimeZone);
    start.setHours(9, 0, 0, 0);
    const end = addMinutes(new Date(start), durationMinutes);
    return { start, end };
  }, [durationMinutes, placeTimeZone, selectedDate]);

  const selectedDayKey = React.useMemo(
    () => getZonedDayKey(selectedDate, placeTimeZone),
    [placeTimeZone, selectedDate],
  );
  const selectedDayLabel = React.useMemo(
    () =>
      format(getZonedDate(selectedDate, placeTimeZone), "EEEE, MMMM d, yyyy"),
    [placeTimeZone, selectedDate],
  );

  const openWalkInDialog = React.useCallback((preset?: TimeSlot | null) => {
    setWalkInPreset(preset ?? null);
    setWalkInOpen(true);
  }, []);

  const openMaintenanceDialog = React.useCallback(
    (preset?: TimeSlot | null) => {
      setMaintenancePreset(preset ?? null);
      setMaintenanceOpen(true);
    },
    [],
  );

  const availabilityQuery = trpc.availability.getForCourtRange.useQuery(
    {
      courtId,
      startDate: monthRangeStartIso,
      endDate: monthRangeEndIso,
      durationMinutes,
      includeUnavailable: true,
    },
    {
      enabled: Boolean(courtId) && durationMinutes > 0,
    },
  );

  const blocksQuery = trpc.courtBlock.listForCourtRange.useQuery(
    {
      courtId,
      startTime: monthRangeStartIso,
      endTime: monthRangeEndIso,
    },
    { enabled: Boolean(courtId) },
  );

  const availabilityOptions = availabilityQuery.data?.options ?? [];
  const availabilityDiagnostics = availabilityQuery.data?.diagnostics;

  const monthAvailabilityByDay = React.useMemo<MonthDayAvailability[]>(() => {
    const slotsByDay = new Map<string, TimeSlot[]>();
    for (const option of availabilityOptions) {
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
  }, [availabilityOptions, durationMinutes, placeTimeZone]);

  const selectedSlot = React.useMemo(() => {
    if (!selectedSlotId) return null;
    for (const day of monthAvailabilityByDay) {
      const match = day.slots.find((slot) => slot.id === selectedSlotId);
      if (match) return match;
    }
    return null;
  }, [monthAvailabilityByDay, selectedSlotId]);

  type CourtBlockItem = NonNullable<typeof blocksQuery.data>[number];

  const blocksByDay = React.useMemo(() => {
    const grouped = new Map<string, CourtBlockItem[]>();
    for (const block of blocksQuery.data ?? []) {
      if (!block.isActive) continue;
      const dayKey = getZonedDayKey(block.startTime, placeTimeZone);
      const existing = grouped.get(dayKey);
      if (existing) {
        existing.push(block);
      } else {
        grouped.set(dayKey, [block]);
      }
    }
    return grouped;
  }, [blocksQuery.data, placeTimeZone]);

  const selectedDayBlocks = React.useMemo(() => {
    const blocks = blocksByDay.get(selectedDayKey) ?? [];
    return [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [blocksByDay, selectedDayKey]);

  const createMaintenance = trpc.courtBlock.createMaintenance.useMutation();
  const createWalkIn = trpc.courtBlock.createWalkIn.useMutation();
  const cancelBlock = trpc.courtBlock.cancel.useMutation();

  const invalidateAvailability = React.useCallback(() => {
    void utils.availability.getForCourtRange.invalidate();
    void utils.courtBlock.listForCourtRange.invalidate();
  }, [utils]);

  const buildBlockPayload = React.useCallback(
    (values: BlockFormValues) => {
      const start = parseDateTimeInput(values.startTime, placeTimeZone);
      const end = parseDateTimeInput(values.endTime, placeTimeZone);
      if (!start || !end) {
        toast.error("Invalid date or time", {
          description: "Please enter a valid start and end time.",
        });
        return null;
      }

      const reason = values.reason?.trim();
      return {
        startTime: toUtcISOString(start),
        endTime: toUtcISOString(end),
        reason: reason && reason.length > 0 ? reason : undefined,
      };
    },
    [placeTimeZone],
  );

  const handleMaintenanceSubmit = React.useCallback(
    async (values: BlockFormValues) => {
      const payload = buildBlockPayload(values);
      if (!payload) return;
      try {
        await createMaintenance.mutateAsync({ courtId, ...payload });
        toast.success("Maintenance block added");
        setMaintenanceOpen(false);
        invalidateAvailability();
      } catch (error) {
        toast.error("Unable to add block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [buildBlockPayload, courtId, createMaintenance, invalidateAvailability],
  );

  const handleWalkInSubmit = React.useCallback(
    async (values: BlockFormValues) => {
      const payload = buildBlockPayload(values);
      if (!payload) return;
      try {
        await createWalkIn.mutateAsync({ courtId, ...payload });
        toast.success("Walk-in booking added");
        setWalkInOpen(false);
        setWalkInPreset(null);
        invalidateAvailability();
      } catch (error) {
        toast.error("Unable to add walk-in booking", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [buildBlockPayload, courtId, createWalkIn, invalidateAvailability],
  );

  const handleCancelBlock = React.useCallback(
    async (blockId: string) => {
      const confirmed = window.confirm("Remove this block?");
      if (!confirmed) return;
      try {
        await cancelBlock.mutateAsync({ blockId });
        toast.success("Block removed");
        invalidateAvailability();
      } catch (error) {
        toast.error("Unable to remove block", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    },
    [cancelBlock, invalidateAvailability],
  );

  const renderSlotAction = React.useCallback(
    ({
      slot,
      isSelected,
      isDisabled,
      date,
    }: {
      slot: TimeSlot;
      isSelected: boolean;
      isDisabled: boolean;
      date: Date;
    }) => {
      if (isDisabled) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 text-[11px] uppercase tracking-wide transition-colors",
                isSelected
                  ? "border-primary/40 text-primary bg-primary/5"
                  : "border-transparent bg-muted/70 text-muted-foreground hover:border-border/70 hover:text-foreground",
              )}
              onClick={() => {
                setSelectedDate(date);
                setSelectedSlotId(slot.id);
              }}
            >
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => openWalkInDialog(slot)}>
              Walk-in booking
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openMaintenanceDialog(slot)}>
              Maintenance block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [openMaintenanceDialog, openWalkInDialog],
  );

  React.useEffect(() => {
    if (!maintenanceOpen) return;
    const range = maintenancePreset
      ? {
          start: new Date(maintenancePreset.startTime),
          end: new Date(maintenancePreset.endTime),
        }
      : defaultRange;
    maintenanceForm.reset({
      startTime: formatDateTimeInput(range.start, placeTimeZone),
      endTime: formatDateTimeInput(range.end, placeTimeZone),
      reason: "",
    });
  }, [
    defaultRange,
    maintenanceForm,
    maintenanceOpen,
    maintenancePreset,
    placeTimeZone,
  ]);

  React.useEffect(() => {
    if (!walkInOpen) return;
    const range = walkInPreset
      ? {
          start: new Date(walkInPreset.startTime),
          end: new Date(walkInPreset.endTime),
        }
      : defaultRange;
    walkInForm.reset({
      startTime: formatDateTimeInput(range.start, placeTimeZone),
      endTime: formatDateTimeInput(range.end, placeTimeZone),
      reason: "",
    });
  }, [defaultRange, placeTimeZone, walkInForm, walkInOpen, walkInPreset]);

  const availableMonthDates = React.useMemo(
    () =>
      monthAvailabilityByDay
        .filter((day) => day.slots.some((slot) => slot.status === "available"))
        .map((day) => day.date),
    [monthAvailabilityByDay],
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
      setSelectedDate(date);
      setSelectedSlotId(undefined);
      scrollToDayKey(getZonedDayKey(date, placeTimeZone));
    },
    [placeTimeZone, scrollToDayKey],
  );

  const handleMonthChange = React.useCallback((date: Date) => {
    setMonthStart(startOfMonth(date));
    setSelectedSlotId(undefined);
  }, []);

  const handleMonthToday = React.useCallback(() => {
    setMonthStart(startOfMonth(today));
    setSelectedDate(today);
    setSelectedSlotId(undefined);
    scrollToDayKey(getZonedDayKey(today, placeTimeZone));
  }, [placeTimeZone, scrollToDayKey, today]);

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

  const scheduleHref = appRoutes.owner.places.courts.schedule(placeId, courtId);
  const reservationsHref = `${appRoutes.owner.reservations}?placeId=${placeId}&courtId=${courtId}`;

  const verificationHref = appRoutes.owner.verification.place(placeId);

  const emptyState = (
    <AvailabilityEmptyState
      diagnostics={availabilityDiagnostics}
      variant="owner"
      scheduleHref={scheduleHref}
      verificationHref={verificationHref}
    />
  );

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
        <PageHeader
          title={`Availability · ${courtData.court.label}`}
          description="Schedule-derived availability based on hours, pricing, blocks, and reservations."
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Availability" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={scheduleHref}>Edit schedule</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={reservationsHref}>View bookings</Link>
              </Button>
            </>
          }
        />

        <Card>
          <CardContent className="space-y-4 p-6">
            {availabilityQuery.error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load availability</AlertTitle>
                <AlertDescription>
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
                      onClick={() => availabilityQuery.refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
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
                  <p className="text-xs text-muted-foreground">
                    Availability is capped to {MAX_BOOKING_WINDOW_DAYS} days.
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:justify-self-end">
                <p className="text-sm font-medium">Time zone</p>
                <p className="text-sm text-muted-foreground">{placeTimeZone}</p>
              </div>
            </div>

            <AvailabilityMonthView
              selectedDate={selectedDate}
              month={monthStart}
              fromMonth={minMonthStart}
              toMonth={maxMonthStart}
              minDate={todayRange.start}
              maxDate={maxDate}
              availableDates={availableMonthDates}
              days={monthAvailabilityByDay}
              selectedSlotId={selectedSlotId}
              isLoading={availabilityQuery.isLoading}
              timeZone={placeTimeZone}
              renderSlotAction={renderSlotAction}
              onSelectDate={handleMonthSelect}
              onMonthChange={handleMonthChange}
              onToday={handleMonthToday}
              onSelectSlot={({ dayKey, slot }) => {
                setSelectedDate(parseDayKeyToDate(dayKey, placeTimeZone));
                setSelectedSlotId(slot.id);
              }}
              emptyState={emptyState}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-heading font-semibold">
                  Blocks · {selectedDayLabel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Maintenance and walk-in bookings remove availability.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMaintenanceOpen(true)}
                  disabled={createMaintenance.isPending}
                >
                  Add maintenance block
                </Button>
                <Button
                  type="button"
                  onClick={() => openWalkInDialog()}
                  disabled={createWalkIn.isPending}
                >
                  Add walk-in booking
                </Button>
              </div>
            </div>

            {selectedSlot ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-medium">Selected time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeRangeInTimeZone(
                      selectedSlot.startTime,
                      selectedSlot.endTime,
                      placeTimeZone,
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openWalkInDialog(selectedSlot)}
                  disabled={createWalkIn.isPending}
                >
                  Mark as booked (walk-in)
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Select an available time to quickly mark a walk-in booking.
              </div>
            )}

            {blocksQuery.error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to load blocks</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-col gap-2">
                    <p>Please try again.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => blocksQuery.refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {blocksQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading blocks...
                </p>
              ) : selectedDayBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No blocks for this day yet.
                </p>
              ) : (
                selectedDayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            block.type === "WALK_IN" ? "paid" : "warning"
                          }
                        >
                          {block.type === "WALK_IN" ? "Walk-in" : "Maintenance"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatTimeRangeInTimeZone(
                            block.startTime,
                            block.endTime,
                            placeTimeZone,
                          )}
                        </span>
                      </div>
                      {block.reason && (
                        <p className="text-sm text-muted-foreground">
                          {block.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
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
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelBlock(block.id)}
                        disabled={cancelBlock.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={maintenanceOpen}
          onOpenChange={(open) => {
            setMaintenanceOpen(open);
            if (!open) {
              setMaintenancePreset(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add maintenance block</DialogTitle>
              <DialogDescription>
                Block a time range for maintenance or private events. Times are
                shown in {placeTimeZone}.
              </DialogDescription>
            </DialogHeader>
            <StandardFormProvider
              form={maintenanceForm}
              onSubmit={handleMaintenanceSubmit}
            >
              <div className="space-y-4">
                <StandardFormInput<BlockFormValues>
                  name="startTime"
                  label="Start time"
                  type="datetime-local"
                  required
                />
                <StandardFormInput<BlockFormValues>
                  name="endTime"
                  label="End time"
                  type="datetime-local"
                  required
                />
                <StandardFormTextarea<BlockFormValues>
                  name="reason"
                  label="Reason (optional)"
                  placeholder="Net replacement"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMaintenanceOpen(false);
                    setMaintenancePreset(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMaintenance.isPending}>
                  Save block
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          </DialogContent>
        </Dialog>

        <Dialog
          open={walkInOpen}
          onOpenChange={(open) => {
            setWalkInOpen(open);
            if (!open) {
              setWalkInPreset(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add walk-in booking</DialogTitle>
              <DialogDescription>
                Reserve a time range for a walk-in customer. Pricing is computed
                from your schedule in {placeTimeZone}.
              </DialogDescription>
            </DialogHeader>
            <StandardFormProvider
              form={walkInForm}
              onSubmit={handleWalkInSubmit}
            >
              <div className="space-y-4">
                <StandardFormInput<BlockFormValues>
                  name="startTime"
                  label="Start time"
                  type="datetime-local"
                  required
                />
                <StandardFormInput<BlockFormValues>
                  name="endTime"
                  label="End time"
                  type="datetime-local"
                  required
                />
                <StandardFormTextarea<BlockFormValues>
                  name="reason"
                  label="Note (optional)"
                  placeholder="Walk-in: Name, phone"
                />
                <p className="text-xs text-muted-foreground">
                  Walk-in bookings must be in 60-minute increments.
                </p>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setWalkInOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createWalkIn.isPending}>
                  Save walk-in
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
