"use client";

import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCopyCourtHours,
  useCopyCourtRateRules,
  useCourtHours,
  useCourtRateRules,
  useOwnerCourts,
  useSaveCourtHours,
  useSaveCourtRateRules,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import { CourtConfigCopyDialog } from "./court-config-copy-dialog";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const DAY_KEYS = DAY_OPTIONS.map((day) => day.value);
const CURRENCY_OPTIONS = ["PHP", "USD"];
const DEFAULT_CURRENCY = "PHP";

type HoursWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

type RateRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  currency: string;
  hourlyRateCents: number;
};

type BlockRow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  currency: string;
  hourlyRate: number | "";
  allowPricing: boolean;
};

type BlockSegment = Omit<BlockRow, "id">;

type BlockIntervals = {
  rowId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

interface CourtScheduleEditorProps {
  courtId: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  timeZone?: string | null;
  onSaved?: () => void;
}

const createRowId = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const parseTime = (value: string) => {
  if (!value) return null;
  const [hours, mins] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
};

const createEmptyRow = (dayOfWeek: number): BlockRow => ({
  id: createRowId(),
  dayOfWeek,
  startTime: "08:00",
  endTime: "20:00",
  isOpen: true,
  currency: DEFAULT_CURRENCY,
  hourlyRate: "",
  allowPricing: true,
});

const buildIntervals = (row: BlockRow): BlockIntervals[] => {
  const startMinute = parseTime(row.startTime);
  const endMinute = parseTime(row.endTime);
  if (startMinute === null || endMinute === null) return [];
  if (endMinute > startMinute) {
    return [
      {
        rowId: row.id,
        dayOfWeek: row.dayOfWeek,
        startMinute,
        endMinute,
      },
    ];
  }
  const nextDay = (row.dayOfWeek + 1) % 7;
  const intervals: BlockIntervals[] = [
    {
      rowId: row.id,
      dayOfWeek: row.dayOfWeek,
      startMinute,
      endMinute: 1440,
    },
  ];
  if (endMinute > 0) {
    intervals.push({
      rowId: row.id,
      dayOfWeek: nextDay,
      startMinute: 0,
      endMinute: endMinute,
    });
  }
  return intervals;
};

const mergeSegments = (segments: BlockSegment[]) => {
  if (segments.length === 0) return [] as BlockRow[];
  const merged: BlockSegment[] = [segments[0]];
  for (let i = 1; i < segments.length; i += 1) {
    const current = segments[i];
    const previous = merged[merged.length - 1];
    const isSameBlock =
      previous.endTime === current.startTime &&
      previous.isOpen === current.isOpen &&
      previous.currency === current.currency &&
      previous.hourlyRate === current.hourlyRate &&
      previous.allowPricing === current.allowPricing;
    if (isSameBlock) {
      previous.endTime = current.endTime;
    } else {
      merged.push(current);
    }
  }
  return merged.map((segment) => ({ ...segment, id: createRowId() }));
};

const buildRowsByDay = (hours: HoursWindow[], rules: RateRule[]) => {
  const result: Record<number, BlockRow[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  DAY_KEYS.forEach((day) => {
    const dayHours = hours
      .filter((window) => window.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    const dayRules = rules
      .filter((rule) => rule.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    const boundaries = new Set<number>();
    dayHours.forEach((window) => {
      boundaries.add(window.startMinute);
      boundaries.add(window.endMinute);
    });
    dayRules.forEach((rule) => {
      boundaries.add(rule.startMinute);
      boundaries.add(rule.endMinute);
    });

    const sorted = Array.from(boundaries).sort((a, b) => a - b);
    const segments: BlockSegment[] = [];

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const startMinute = sorted[i];
      const endMinute = sorted[i + 1];
      if (startMinute === endMinute) continue;

      const hoursWindow = dayHours.find(
        (window) =>
          window.startMinute <= startMinute && window.endMinute >= endMinute,
      );
      const pricingRule = dayRules.find(
        (rule) =>
          rule.startMinute <= startMinute && rule.endMinute >= endMinute,
      );

      if (!hoursWindow && !pricingRule) continue;

      const hourlyRate = pricingRule ? pricingRule.hourlyRateCents / 100 : "";
      const isOpen = Boolean(hoursWindow);
      const allowPricing = isOpen || hourlyRate !== "";
      segments.push({
        dayOfWeek: day,
        startTime: toTimeString(startMinute),
        endTime: toTimeString(endMinute),
        isOpen,
        currency: pricingRule?.currency ?? DEFAULT_CURRENCY,
        hourlyRate,
        allowPricing,
      });
    }

    result[day] = mergeSegments(segments);
  });

  return result;
};

const isRowsByDayEmpty = (rowsByDay: Record<number, BlockRow[]>) =>
  DAY_KEYS.every((day) => (rowsByDay[day] ?? []).length === 0);

const createDefaultRowsByDay = (): Record<number, BlockRow[]> => {
  const seeded: Record<number, BlockRow[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  DAY_KEYS.forEach((day) => {
    seeded[day] = [createEmptyRow(day)];
  });

  return seeded;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function CourtScheduleEditor({
  courtId,
  organizationId,
  primaryActionLabel = "Save schedule",
  timeZone,
  onSaved,
}: CourtScheduleEditorProps) {
  const { data: hours = [], isLoading: hoursLoading } = useCourtHours(courtId);
  const { data: rules = [], isLoading: rulesLoading } =
    useCourtRateRules(courtId);
  const saveHours = useSaveCourtHours(courtId);
  const saveRules = useSaveCourtRateRules(courtId);
  const copyHours = useCopyCourtHours(courtId);
  const copyRules = useCopyCourtRateRules(courtId);
  const { data: courts = [] } = useOwnerCourts(organizationId ?? null);

  const [rowsByDay, setRowsByDay] = React.useState<Record<number, BlockRow[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [openDays, setOpenDays] = React.useState<number[]>(() => [...DAY_KEYS]);
  const [copyOpen, setCopyOpen] = React.useState(false);

  React.useEffect(() => {
    if (hoursLoading || rulesLoading || hasInitialized) return;
    const baseRows = buildRowsByDay(hours, rules);
    const nextRows = isRowsByDayEmpty(baseRows)
      ? createDefaultRowsByDay()
      : baseRows;

    setRowsByDay(nextRows);
    setOpenDays([...DAY_KEYS]);

    setHasInitialized(true);
  }, [hasInitialized, hours, hoursLoading, rules, rulesLoading]);

  const isLoading = hoursLoading || rulesLoading;
  const isSaving = saveHours.isPending || saveRules.isPending;
  const isCopying = copyHours.isPending || copyRules.isPending;

  const validation = React.useMemo(() => {
    const invalidRows = new Set<string>();
    const openWithoutPrice = new Set<string>();
    const closedWithPrice = new Set<string>();
    const overnightRows = new Set<string>();
    const overlappingHours = new Set<string>();
    const overlappingPricing = new Set<string>();

    const openIntervals = new Map<number, BlockIntervals[]>();
    const pricingIntervals = new Map<number, BlockIntervals[]>();

    DAY_KEYS.forEach((day) => {
      openIntervals.set(day, []);
      pricingIntervals.set(day, []);
    });

    Object.values(rowsByDay).forEach((rows) => {
      rows.forEach((row) => {
        const startMinute = parseTime(row.startTime);
        const endMinute = parseTime(row.endTime);
        if (startMinute === null || endMinute === null) {
          invalidRows.add(row.id);
          return;
        }
        if (endMinute <= startMinute) {
          overnightRows.add(row.id);
        }
        if (row.isOpen && row.hourlyRate === "") {
          openWithoutPrice.add(row.id);
        }
        if (!row.isOpen && row.hourlyRate !== "") {
          closedWithPrice.add(row.id);
        }

        const intervals = buildIntervals(row);
        if (row.isOpen) {
          intervals.forEach((interval) => {
            openIntervals.get(interval.dayOfWeek)?.push(interval);
          });
        }
        if (row.hourlyRate !== "") {
          intervals.forEach((interval) => {
            pricingIntervals.get(interval.dayOfWeek)?.push(interval);
          });
        }
      });
    });

    const markOverlaps = (
      intervalsByDay: Map<number, BlockIntervals[]>,
      target: Set<string>,
    ) => {
      intervalsByDay.forEach((intervals) => {
        const sorted = [...intervals].sort(
          (a, b) => a.startMinute - b.startMinute,
        );
        for (let i = 1; i < sorted.length; i += 1) {
          const previous = sorted[i - 1];
          const current = sorted[i];
          if (current.startMinute < previous.endMinute) {
            target.add(previous.rowId);
            target.add(current.rowId);
          }
        }
      });
    };

    markOverlaps(openIntervals, overlappingHours);
    markOverlaps(pricingIntervals, overlappingPricing);

    return {
      invalidRows,
      openWithoutPrice,
      closedWithPrice,
      overnightRows,
      overlappingHours,
      overlappingPricing,
      hasBlockingIssues:
        invalidRows.size > 0 ||
        overlappingHours.size > 0 ||
        overlappingPricing.size > 0,
    };
  }, [rowsByDay]);

  const setDayRows = React.useCallback(
    (day: number, updater: (rows: BlockRow[]) => BlockRow[]) => {
      setRowsByDay((prev) => ({
        ...prev,
        [day]: updater(prev[day] ?? []),
      }));
    },
    [],
  );

  const handleAddRow = (day: number) => {
    setDayRows(day, (rows) => [...rows, createEmptyRow(day)]);
  };

  const handleRemoveRow = (day: number, rowId: string) => {
    setDayRows(day, (rows) => rows.filter((row) => row.id !== rowId));
  };

  const handleRowChange = (
    day: number,
    rowId: string,
    changes: Partial<BlockRow>,
  ) => {
    setDayRows(day, (rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...changes,
              allowPricing:
                changes.isOpen === undefined
                  ? (changes.allowPricing ?? row.allowPricing)
                  : changes.isOpen
                    ? true
                    : row.hourlyRate !== "",
            }
          : row,
      ),
    );
  };

  const handleHourlyRateInput = (
    day: number,
    rowId: string,
    rawValue: string,
  ) => {
    const parsed = rawValue === "" ? "" : Number(rawValue);
    const hourlyRate = parsed === "" || Number.isNaN(parsed) ? "" : parsed;

    setDayRows(day, (rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, hourlyRate, allowPricing: true } : row,
      ),
    );
  };

  const handleApplyRateToAll = (sourceDay: number, sourceRowId: string) => {
    setRowsByDay((prev) => {
      const sourceRow = (prev[sourceDay] ?? []).find(
        (row) => row.id === sourceRowId,
      );
      if (!sourceRow || sourceRow.hourlyRate === "") return prev;

      const next: Record<number, BlockRow[]> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
      };

      DAY_KEYS.forEach((currentDay) => {
        next[currentDay] = (prev[currentDay] ?? []).map((row) => {
          if (row.id === sourceRowId) return row;
          if (!row.isOpen) return row;
          return {
            ...row,
            hourlyRate: sourceRow.hourlyRate,
            currency: sourceRow.currency,
            allowPricing: true,
          };
        });
      });

      return next;
    });

    toast.success("Rate applied to all open blocks");
  };

  const handleCopySchedule = async (sourceCourtId: string) => {
    try {
      const [copiedHours, copiedRules] = await Promise.all([
        copyHours.mutateAsync({ sourceCourtId, targetCourtId: courtId }),
        copyRules.mutateAsync({ sourceCourtId, targetCourtId: courtId }),
      ]);
      const nextRows = buildRowsByDay(copiedHours, copiedRules);
      setRowsByDay(nextRows);
      setOpenDays([...DAY_KEYS]);

      setCopyOpen(false);
      toast.success("Schedule copied");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to copy schedule"));
    }
  };

  const handleSave = async () => {
    if (validation.hasBlockingIssues) {
      toast.error("Resolve overlapping or invalid blocks before saving.");
      return;
    }

    const hoursPayload: HoursWindow[] = [];
    const rulesPayload: RateRule[] = [];

    Object.values(rowsByDay).forEach((rows) => {
      rows.forEach((row) => {
        const intervals = buildIntervals(row);
        if (row.isOpen) {
          intervals.forEach((interval) => {
            hoursPayload.push({
              dayOfWeek: interval.dayOfWeek,
              startMinute: interval.startMinute,
              endMinute: interval.endMinute,
            });
          });
        }

        if (row.hourlyRate !== "") {
          intervals.forEach((interval) => {
            rulesPayload.push({
              dayOfWeek: interval.dayOfWeek,
              startMinute: interval.startMinute,
              endMinute: interval.endMinute,
              currency: row.currency || DEFAULT_CURRENCY,
              hourlyRateCents: Math.round(Number(row.hourlyRate) * 100),
            });
          });
        }
      });
    });

    try {
      await Promise.all([
        saveHours.mutateAsync({ courtId, windows: hoursPayload }),
        saveRules.mutateAsync({ courtId, rules: rulesPayload }),
      ]);
      toast.success("Schedule saved");
      onSaved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save schedule"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-heading font-semibold">
              Schedule & Pricing
            </h3>
            <p className="text-sm text-muted-foreground">
              Set opening hours and rates for each day.
            </p>
          </div>
          {timeZone && (
            <span className="text-xs text-muted-foreground">
              Times are in {timeZone}
            </span>
          )}
        </div>

        {validation.hasBlockingIssues && (
          <Alert variant="destructive">
            <AlertTitle>Fix schedule conflicts</AlertTitle>
            <AlertDescription>
              Resolve overlapping or invalid time blocks before saving.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCopyOpen(true)}
            disabled={!organizationId || courts.length <= 1}
          >
            Copy schedule from another court
          </Button>
        </div>

        <div className="space-y-3">
          {DAY_OPTIONS.map((day) => {
            const dayRows = rowsByDay[day.value] ?? [];
            const isOpen = openDays.includes(day.value);
            const missingPriceCount = dayRows.filter((row) =>
              validation.openWithoutPrice.has(row.id),
            ).length;
            const overlapCount = dayRows.filter(
              (row) =>
                validation.overlappingHours.has(row.id) ||
                validation.overlappingPricing.has(row.id),
            ).length;
            const invalidCount = dayRows.filter((row) =>
              validation.invalidRows.has(row.id),
            ).length;
            const overnightCount = dayRows.filter((row) =>
              validation.overnightRows.has(row.id),
            ).length;

            return (
              <Collapsible
                key={day.value}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenDays((prev) =>
                    open
                      ? Array.from(new Set([...prev, day.value]))
                      : prev.filter((value) => value !== day.value),
                  )
                }
              >
                <div className="rounded-lg border">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 text-left transition hover:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium">{day.label}</span>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {dayRows.length} blocks
                          </Badge>
                          {missingPriceCount > 0 && (
                            <Badge variant="warning">
                              {missingPriceCount} missing price
                            </Badge>
                          )}
                          {overlapCount > 0 && (
                            <Badge variant="destructive">
                              {overlapCount} overlaps
                            </Badge>
                          )}
                          {invalidCount > 0 && (
                            <Badge variant="destructive">
                              {invalidCount} invalid
                            </Badge>
                          )}
                          {overnightCount > 0 && (
                            <Badge variant="outline">
                              {overnightCount} overnight
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t px-4 pb-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddRow(day.value)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add block
                      </Button>
                    </div>

                    {dayRows.length === 0 ? (
                      <p className="pt-3 text-sm text-muted-foreground">
                        No blocks for this day yet. Add a block to start.
                      </p>
                    ) : (
                      <div className="pt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                              <TableHead>Open</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Hourly rate</TableHead>
                              <TableHead>Issues</TableHead>
                              <TableHead className="text-right">
                                Remove
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayRows.map((row) => {
                              const hasInvalidTime = validation.invalidRows.has(
                                row.id,
                              );
                              const overlapsHours =
                                validation.overlappingHours.has(row.id);
                              const overlapsPricing =
                                validation.overlappingPricing.has(row.id);
                              const missingPrice =
                                validation.openWithoutPrice.has(row.id);
                              const closedWithPrice =
                                validation.closedWithPrice.has(row.id);
                              const isOvernight = validation.overnightRows.has(
                                row.id,
                              );
                              const hasError =
                                hasInvalidTime ||
                                overlapsHours ||
                                overlapsPricing;

                              const issueLabels = [
                                hasInvalidTime ? "Invalid time" : null,
                                overlapsHours ? "Hours overlap" : null,
                                overlapsPricing ? "Pricing overlap" : null,
                                missingPrice ? "Needs price" : null,
                                closedWithPrice ? "Closed + priced" : null,
                                isOvernight ? "Overnight" : null,
                              ].filter(Boolean);

                              return (
                                <TableRow
                                  key={row.id}
                                  className={cn(hasError && "bg-destructive/5")}
                                >
                                  <TableCell>
                                    <Input
                                      type="time"
                                      value={row.startTime}
                                      onChange={(event) =>
                                        handleRowChange(day.value, row.id, {
                                          startTime: event.target.value,
                                        })
                                      }
                                      className={cn(
                                        hasError &&
                                          "border-destructive focus-visible:ring-destructive/40",
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="time"
                                      value={row.endTime}
                                      onChange={(event) =>
                                        handleRowChange(day.value, row.id, {
                                          endTime: event.target.value,
                                        })
                                      }
                                      className={cn(
                                        hasError &&
                                          "border-destructive focus-visible:ring-destructive/40",
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={row.isOpen}
                                        onCheckedChange={(checked) =>
                                          handleRowChange(day.value, row.id, {
                                            isOpen: checked,
                                          })
                                        }
                                        aria-label="Toggle open hours"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {row.isOpen ? "Open" : "Closed"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={row.currency}
                                      onValueChange={(value) =>
                                        handleRowChange(day.value, row.id, {
                                          currency: value,
                                        })
                                      }
                                      disabled={!row.allowPricing}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Currency" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {CURRENCY_OPTIONS.map((currency) => (
                                          <SelectItem
                                            key={currency}
                                            value={currency}
                                          >
                                            {currency}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    {row.allowPricing ? (
                                      <div className="flex items-center gap-1.5">
                                        <Input
                                          type="number"
                                          min={0}
                                          value={row.hourlyRate}
                                          onChange={(event) =>
                                            handleHourlyRateInput(
                                              day.value,
                                              row.id,
                                              event.target.value,
                                            )
                                          }
                                          className={cn(
                                            hasError &&
                                              "border-destructive focus-visible:ring-destructive/40",
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="shrink-0 text-xs"
                                          disabled={row.hourlyRate === ""}
                                          onClick={() =>
                                            handleApplyRateToAll(
                                              day.value,
                                              row.id,
                                            )
                                          }
                                        >
                                          Apply to all
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRowChange(day.value, row.id, {
                                            allowPricing: true,
                                          })
                                        }
                                      >
                                        Add pricing
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {issueLabels.length > 0 ? (
                                      <div
                                        className={cn(
                                          "text-xs",
                                          hasError
                                            ? "text-destructive"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {issueLabels.join(" · ")}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleRemoveRow(day.value, row.id)
                                      }
                                      aria-label="Remove block"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : primaryActionLabel}
          </Button>
        </div>
      </CardContent>

      <CourtConfigCopyDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        title="Copy schedule"
        description="Copy hours and pricing from another court. This will replace the current schedule."
        courts={courts}
        currentCourtId={courtId}
        isSubmitting={isCopying}
        onConfirm={handleCopySchedule}
      />
    </Card>
  );
}
