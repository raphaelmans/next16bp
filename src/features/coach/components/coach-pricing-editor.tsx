"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  COACH_DAY_OPTIONS,
  getCoachDayLabel,
  minutesToTimeString,
  timeStringToMinutes,
} from "@/features/coach/helpers";
import {
  useMutCoachSetRateRules,
  useQueryCoachRateRules,
} from "@/features/coach/hooks";

type RateRuleRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  hourlyRate: number | "";
};

function createDefaultRuleRow(): RateRuleRow {
  return {
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "17:00",
    hourlyRate: "",
  };
}

export function CoachPricingEditor({ coachId }: { coachId: string }) {
  const { data: rules = [], isLoading } = useQueryCoachRateRules(coachId);
  const saveRules = useMutCoachSetRateRules(coachId);
  const [rows, setRows] = React.useState<RateRuleRow[]>([]);

  React.useEffect(() => {
    setRows(
      rules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: minutesToTimeString(rule.startMinute),
        endTime: minutesToTimeString(rule.endMinute),
        hourlyRate: rule.hourlyRateCents / 100,
      })),
    );
  }, [rules]);

  const { invalidRanges, overlappingRanges } = React.useMemo(() => {
    const invalid = new Set<number>();
    const overlaps = new Set<number>();
    const ranges = rows.map((row, index) => ({
      index,
      dayOfWeek: row.dayOfWeek,
      startMinute: timeStringToMinutes(row.startTime),
      endMinute: timeStringToMinutes(row.endTime),
    }));

    ranges.forEach((range) => {
      if (range.endMinute <= range.startMinute) {
        invalid.add(range.index);
      }
    });

    for (let index = 0; index < ranges.length; index += 1) {
      for (
        let compareIndex = index + 1;
        compareIndex < ranges.length;
        compareIndex += 1
      ) {
        const current = ranges[index];
        const next = ranges[compareIndex];

        if (current.dayOfWeek !== next.dayOfWeek) {
          continue;
        }

        if (
          current.endMinute <= current.startMinute ||
          next.endMinute <= next.startMinute
        ) {
          continue;
        }

        const overlapsRange =
          Math.max(current.startMinute, next.startMinute) <
          Math.min(current.endMinute, next.endMinute);

        if (overlapsRange) {
          overlaps.add(current.index);
          overlaps.add(next.index);
        }
      }
    }

    return {
      invalidRanges: invalid,
      overlappingRanges: overlaps,
    };
  }, [rows]);

  const hasConflicts = invalidRanges.size > 0 || overlappingRanges.size > 0;

  const handleRowChange = (
    index: number,
    field: keyof RateRuleRow,
    value: string | number,
  ) => {
    setRows((current) =>
      current.map((row, currentIndex) =>
        currentIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleSave = () => {
    if (hasConflicts) {
      toast.error("Resolve overlapping or invalid rules before saving.");
      return;
    }

    saveRules.mutate(
      {
        coachId,
        rules: rows.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          startMinute: timeStringToMinutes(row.startTime),
          endMinute: timeStringToMinutes(row.endTime),
          hourlyRateCents:
            row.hourlyRate === ""
              ? 0
              : Math.round(Number(row.hourlyRate) * 100),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Coach pricing saved");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save coach pricing");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border bg-card">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="font-heading text-xl">Rate rules</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set time-window pricing that matches your coaching schedule. These
          rules drive setup readiness and future booking estimates.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {hasConflicts ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Resolve invalid or overlapping time windows before saving.
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No pricing rules yet. Add your first rate rule to unlock the pricing
            step.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const hasInvalidRange = invalidRanges.has(index);
              const hasOverlap = overlappingRanges.has(index);
              const hasIssue = hasInvalidRange || hasOverlap;
              const issueLabel = hasInvalidRange
                ? "End time must be after start time."
                : hasOverlap
                  ? `This window overlaps another ${getCoachDayLabel(row.dayOfWeek)} rule.`
                  : null;

              return (
                <div
                  key={`coach-rate-rule-${row.dayOfWeek}-${index}`}
                  className="rounded-xl border p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_140px_140px_160px_auto] md:items-end">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select
                        value={String(row.dayOfWeek)}
                        onValueChange={(value) =>
                          handleRowChange(index, "dayOfWeek", Number(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {COACH_DAY_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Start</Label>
                      <Input
                        type="time"
                        value={row.startTime}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "startTime",
                            event.target.value,
                          )
                        }
                        className={hasIssue ? "border-destructive" : undefined}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={(event) =>
                          handleRowChange(index, "endTime", event.target.value)
                        }
                        className={hasIssue ? "border-destructive" : undefined}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hourly rate (PHP)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.hourlyRate}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "hourlyRate",
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setRows((current) =>
                            current.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          )
                        }
                        aria-label="Remove rate rule"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {issueLabel ? (
                    <p className="mt-3 text-sm text-destructive">
                      {issueLabel}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setRows((current) => [...current, createDefaultRuleRow()])
            }
          >
            <Plus className="mr-2 size-4" />
            Add rate rule
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saveRules.isPending}
          >
            {saveRules.isPending ? (
              <Spinner className="mr-2 size-4 text-current" />
            ) : null}
            Save pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
