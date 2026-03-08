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
  useModCourtHours,
  useMutCopyCourtHours,
  useMutSaveCourtHours,
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

type HoursRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

interface CourtHoursEditorProps {
  courtId: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  showCopyButton?: boolean;
  onSaved?: () => void;
}

export function CourtHoursEditor({
  courtId,
  organizationId,
  primaryActionLabel = "Save hours",
  showCopyButton = true,
  onSaved,
}: CourtHoursEditorProps) {
  const { data: hours = [], isLoading: hoursLoading } =
    useModCourtHours(courtId);
  const saveHours = useMutSaveCourtHours(courtId);
  const copyHours = useMutCopyCourtHours(courtId);
  const { data: courts = [] } = useQueryOwnerCourts(organizationId ?? null);

  const [rows, setRows] = React.useState<HoursRow[]>([]);
  const [copyOpen, setCopyOpen] = React.useState(false);

  React.useEffect(() => {
    if (!hours) return;
    setRows(
      hours.map((window) => ({
        dayOfWeek: window.dayOfWeek,
        startTime: toTimeString(window.startMinute),
        endTime: toTimeString(window.endMinute),
      })),
    );
  }, [hours]);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "08:00", endTime: "20:00" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (
    index: number,
    field: keyof HoursRow,
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleSave = () => {
    const windows = rows.flatMap((row) => {
      const startMinute = toMinutes(row.startTime);
      const endMinute = toMinutes(row.endTime);
      if (endMinute <= startMinute) {
        const nextDay = (row.dayOfWeek + 1) % 7;
        const overnightWindows = [
          {
            dayOfWeek: row.dayOfWeek,
            startMinute,
            endMinute: 1440,
          },
        ];
        if (endMinute > 0) {
          overnightWindows.push({
            dayOfWeek: nextDay,
            startMinute: 0,
            endMinute,
          });
        }
        return overnightWindows;
      }
      return [
        {
          dayOfWeek: row.dayOfWeek,
          startMinute,
          endMinute,
        },
      ];
    });

    saveHours.mutate(
      {
        courtId,
        windows,
      },
      {
        onSuccess: () => {
          toast.success("Venue hours saved");
          onSaved?.();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save hours");
        },
      },
    );
  };

  const handleCopy = (sourceCourtId: string) => {
    copyHours.mutate(
      { sourceCourtId, targetCourtId: courtId },
      {
        onSuccess: (result) => {
          setRows(
            result.map((window) => ({
              dayOfWeek: window.dayOfWeek,
              startTime: toTimeString(window.startMinute),
              endTime: toTimeString(window.endMinute),
            })),
          );
          toast.success("Venue hours copied");
          setCopyOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to copy hours");
        },
      },
    );
  };

  const hasOvernight = rows.some((row) => {
    const startMinute = toMinutes(row.startTime);
    const endMinute = toMinutes(row.endTime);
    return endMinute <= startMinute;
  });

  if (hoursLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {hasOvernight && (
          <p className="text-sm text-muted-foreground">
            Overnight windows (end before start) are split into two days.
          </p>
        )}
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hours yet. Add a window to start.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const startMinute = toMinutes(row.startTime);
              const endMinute = toMinutes(row.endTime);
              const isOvernight = endMinute <= startMinute;
              const nextDayLabel = getDayLabel((row.dayOfWeek + 1) % 7);
              const splitSummary =
                endMinute > 0
                  ? `${getDayLabel(row.dayOfWeek)} ${row.startTime}-24:00 · ${nextDayLabel} 00:00-${row.endTime}`
                  : `${getDayLabel(row.dayOfWeek)} ${row.startTime}-24:00`;

              return (
                <div
                  key={`window-${row.dayOfWeek}-${index}`}
                  className="space-y-2"
                >
                  <div className="grid gap-3 md:grid-cols-[160px_140px_140px_80px] items-end">
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
                    <div className="flex md:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        aria-label="Remove window"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {isOvernight && (
                    <p className="text-xs text-muted-foreground">
                      Overnight window splits into {splitSummary}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleAddRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add window
          </Button>
          {showCopyButton && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyOpen(true)}
              disabled={!organizationId || courts.length <= 1}
            >
              Copy from another venue
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveHours.isPending}
          >
            {saveHours.isPending && <Spinner />}
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>

      {showCopyButton && (
        <CourtConfigCopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          title="Copy venue hours"
          description="Select a source venue to replace this venue’s hours."
          courts={courts}
          currentCourtId={courtId}
          isSubmitting={copyHours.isPending}
          onConfirm={handleCopy}
        />
      )}
    </Card>
  );
}
