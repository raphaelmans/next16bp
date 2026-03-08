"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useModCourtRateRules,
  useMutCopyCourtRateRules,
  useMutSaveCourtRateRules,
  useQueryOwnerCourts,
} from "@/features/owner/hooks";
import { CourtConfigCopyDialog } from "./court-config-copy-dialog";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const getDayLabel = (dayOfWeek: number) =>
  DAY_OPTIONS.find((option) => option.value === dayOfWeek)?.label ?? "Day";

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const toMinutes = (value: string) => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};

type RateRuleRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  hourlyRate: number | "";
};

interface CourtPricingEditorProps {
  courtId: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  showCopyButton?: boolean;
  onSaved?: () => void;
}

export function CourtPricingEditor({
  courtId,
  organizationId,
  primaryActionLabel = "Save pricing",
  showCopyButton = true,
  onSaved,
}: CourtPricingEditorProps) {
  const { data: rules = [], isLoading: rulesLoading } =
    useModCourtRateRules(courtId);
  const saveRules = useMutSaveCourtRateRules(courtId);
  const copyRules = useMutCopyCourtRateRules(courtId);
  const { data: courts = [] } = useQueryOwnerCourts(organizationId ?? null);

  const [rows, setRows] = React.useState<RateRuleRow[]>([]);
  const [copyOpen, setCopyOpen] = React.useState(false);

  React.useEffect(() => {
    if (!rules) return;
    setRows(
      rules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: toTimeString(rule.startMinute),
        endTime: toTimeString(rule.endMinute),
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
      startMinute: toMinutes(row.startTime),
      endMinute: toMinutes(row.endTime),
    }));

    ranges.forEach((range) => {
      if (range.endMinute <= range.startMinute) {
        invalid.add(range.index);
      }
    });

    for (let i = 0; i < ranges.length; i += 1) {
      for (let j = i + 1; j < ranges.length; j += 1) {
        const first = ranges[i];
        const second = ranges[j];
        if (first.dayOfWeek !== second.dayOfWeek) continue;
        if (first.endMinute <= first.startMinute) continue;
        if (second.endMinute <= second.startMinute) continue;
        const overlapsRange =
          Math.max(first.startMinute, second.startMinute) <
          Math.min(first.endMinute, second.endMinute);
        if (overlapsRange) {
          overlaps.add(first.index);
          overlaps.add(second.index);
        }
      }
    }

    return { invalidRanges: invalid, overlappingRanges: overlaps };
  }, [rows]);

  const hasConflicts = invalidRanges.size > 0 || overlappingRanges.size > 0;

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "20:00",
        hourlyRate: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (
    index: number,
    field: keyof RateRuleRow,
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
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
        courtId,
        rules: rows.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          startMinute: toMinutes(row.startTime),
          endMinute: toMinutes(row.endTime),
          hourlyRateCents:
            row.hourlyRate === "" ? 0 : Math.round(row.hourlyRate * 100),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Pricing rules saved");
          onSaved?.();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save pricing rules");
        },
      },
    );
  };

  const handleCopy = (sourceCourtId: string) => {
    copyRules.mutate(
      { sourceCourtId, targetCourtId: courtId },
      {
        onSuccess: (result) => {
          setRows(
            result.map((rule) => ({
              dayOfWeek: rule.dayOfWeek,
              startTime: toTimeString(rule.startMinute),
              endTime: toTimeString(rule.endMinute),
              hourlyRate: rule.hourlyRateCents / 100,
            })),
          );
          toast.success("Pricing rules copied");
          setCopyOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to copy pricing rules");
        },
      },
    );
  };

  if (rulesLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pricing rules yet. Add a rule to start.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const hasInvalidRange = invalidRanges.has(index);
              const hasOverlap = overlappingRanges.has(index);
              const hasIssue = hasInvalidRange || hasOverlap;
              const timeInputClassName = hasIssue
                ? "border-destructive focus-visible:ring-destructive/40"
                : undefined;
              const errorMessage = hasInvalidRange
                ? "End time must be after start time."
                : hasOverlap
                  ? `Overlaps another rule on ${getDayLabel(row.dayOfWeek)}.`
                  : null;

              return (
                <div
                  key={`rule-${row.dayOfWeek}-${index}`}
                  className="space-y-2"
                >
                  <div className="grid gap-3 md:grid-cols-[160px_140px_140px_140px_auto] items-end">
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
                          {DAY_OPTIONS.map((option) => (
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
                        className={timeInputClassName}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "startTime",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input
                        type="time"
                        value={row.endTime === "24:00" ? "00:00" : row.endTime}
                        className={timeInputClassName}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "endTime",
                            event.target.value === "00:00"
                              ? "24:00"
                              : event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hourly Rate</Label>
                      <Input
                        type="number"
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
                        className={timeInputClassName}
                      />
                    </div>
                    <div className="flex md:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        aria-label="Remove rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="text-xs text-destructive">{errorMessage}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleAddRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add rule
          </Button>
          {showCopyButton && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyOpen(true)}
              disabled={!organizationId || courts.length <= 1}
            >
              Copy from another court
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveRules.isPending}
          >
            {saveRules.isPending && <Spinner />}
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>

      {showCopyButton && (
        <CourtConfigCopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          title="Copy pricing rules"
          description="Select a source court to replace this court’s pricing rules."
          courts={courts}
          currentCourtId={courtId}
          isSubmitting={copyRules.isPending}
          onConfirm={handleCopy}
        />
      )}
    </Card>
  );
}
