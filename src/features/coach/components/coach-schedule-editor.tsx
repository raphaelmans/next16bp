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
  useMutCoachSetHours,
  useQueryCoachHours,
} from "@/features/coach/hooks";

type HoursRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function createDefaultHoursRow(): HoursRow {
  return {
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "17:00",
  };
}

export function CoachScheduleEditor({
  coachId,
  primaryActionLabel = "Save weekly hours",
}: {
  coachId: string;
  primaryActionLabel?: string;
}) {
  const { data: hours = [], isLoading } = useQueryCoachHours(coachId);
  const saveHours = useMutCoachSetHours(coachId);
  const [rows, setRows] = React.useState<HoursRow[]>([]);

  React.useEffect(() => {
    setRows(
      hours.map((window) => ({
        dayOfWeek: window.dayOfWeek,
        startTime: minutesToTimeString(window.startMinute),
        endTime: minutesToTimeString(window.endMinute),
      })),
    );
  }, [hours]);

  const hasOvernight = rows.some(
    (row) =>
      timeStringToMinutes(row.endTime) <= timeStringToMinutes(row.startTime),
  );

  const handleRowChange = (
    index: number,
    field: keyof HoursRow,
    value: string | number,
  ) => {
    setRows((current) =>
      current.map((row, currentIndex) =>
        currentIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleSave = () => {
    const windows = rows.flatMap((row) => {
      const startMinute = timeStringToMinutes(row.startTime);
      const endMinute = timeStringToMinutes(row.endTime);

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
        coachId,
        windows,
      },
      {
        onSuccess: () => {
          toast.success("Coach schedule saved");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save coach schedule");
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
        <CardTitle className="font-heading text-xl">Weekly hours</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define the recurring windows when players can book you. Overnight
          ranges are split into two adjacent days when saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {hasOvernight ? (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            One or more windows end after midnight. They will be saved across
            both days.
          </p>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No weekly hours yet. Add your first availability window to unlock
            the schedule step.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const startMinute = timeStringToMinutes(row.startTime);
              const endMinute = timeStringToMinutes(row.endTime);
              const isOvernight = endMinute <= startMinute;
              const nextDayLabel = getCoachDayLabel((row.dayOfWeek + 1) % 7);

              return (
                <div
                  key={`coach-hours-row-${row.dayOfWeek}-${index}`}
                  className="rounded-xl border p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_140px_140px_auto] md:items-end">
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
                        aria-label="Remove hours window"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {isOvernight ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Saves as{" "}
                      <span className="font-medium text-foreground">
                        {getCoachDayLabel(row.dayOfWeek)} {row.startTime}-24:00
                      </span>{" "}
                      and{" "}
                      <span className="font-medium text-foreground">
                        {nextDayLabel} 00:00-{row.endTime}
                      </span>
                      .
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
              setRows((current) => [...current, createDefaultHoursRow()])
            }
          >
            <Plus className="mr-2 size-4" />
            Add window
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveHours.isPending}
          >
            {saveHours.isPending ? (
              <Spinner className="mr-2 size-4 text-current" />
            ) : null}
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
