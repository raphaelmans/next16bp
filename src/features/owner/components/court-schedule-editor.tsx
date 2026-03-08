"use client";

import { CirclePlus, Trash2 } from "lucide-react";
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CourtConfigCopyDialog } from "./court-config-copy-dialog";
import type { BlockRow } from "./court-schedule-editor/helpers";
import { DAY_OPTIONS } from "./court-schedule-editor/helpers";
import { useCourtScheduleEditor } from "./court-schedule-editor/hooks";

/* ─── Local constants & helpers ─── */

const DAY_INITIALS: Record<number, string> = {
  0: "S",
  1: "M",
  2: "T",
  3: "W",
  4: "Th",
  5: "F",
  6: "S",
};

const CURRENCY_SYMBOL = "₱";

function formatMinutesAs12h(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const totalMinutes = h * 60 + m;
  if (totalMinutes === 0 || totalMinutes === 1440) return "12:00 MN";
  if (totalMinutes === 720) return "12:00 NN";
  const suffix = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${suffix}`;
}

function buildDaySummary(rows: BlockRow[]): string {
  if (rows.length === 0) return "";
  const first = rows[0];
  const last = rows[rows.length - 1];
  const timeRange = `${formatMinutesAs12h(first.startTime)} – ${formatMinutesAs12h(last.endTime)}`;
  const priced = rows.find((r) => r.hourlyRate !== "");
  if (priced) {
    return `${timeRange} · ${CURRENCY_SYMBOL}${priced.hourlyRate}`;
  }
  return timeRange;
}

/* ─── ScheduleSlotRow ─── */

type ScheduleSlotRowProps = {
  row: BlockRow;
  dayValue: number;
  isLast: boolean;
  hasError: boolean;
  issueLabels: string[];
  validation: ReturnType<typeof useCourtScheduleEditor>["validation"];
  onRowChange: (day: number, rowId: string, changes: Partial<BlockRow>) => void;
  onHourlyRateInput: (day: number, rowId: string, value: string) => void;
  onApplyToAll: (day: number, rowId: string) => void;
  onRemoveRow: (day: number, rowId: string) => void;
  onAddRow: (day: number) => void;
};

function ScheduleSlotRow({
  row,
  dayValue,
  isLast,
  hasError,
  issueLabels,
  onRowChange,
  onHourlyRateInput,
  onApplyToAll,
  onRemoveRow,
  onAddRow,
}: ScheduleSlotRowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        hasError && "border-destructive bg-destructive/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Time range */}
        <Input
          type="time"
          value={row.startTime}
          onChange={(e) =>
            onRowChange(dayValue, row.id, { startTime: e.target.value })
          }
          className={cn(
            "w-[120px]",
            hasError && "border-destructive focus-visible:ring-destructive/40",
          )}
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="time"
          value={row.endTime === "24:00" ? "00:00" : row.endTime}
          onChange={(e) =>
            onRowChange(dayValue, row.id, {
              endTime: e.target.value === "00:00" ? "24:00" : e.target.value,
            })
          }
          className={cn(
            "w-[120px]",
            hasError && "border-destructive focus-visible:ring-destructive/40",
          )}
        />

        {/* Open/Closed toggle */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <Switch
            checked={row.isOpen}
            onCheckedChange={(checked) =>
              onRowChange(dayValue, row.id, { isOpen: checked })
            }
            aria-label="Toggle open hours"
          />
          <span className="text-xs text-muted-foreground">
            {row.isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Hourly rate */}
        {row.allowPricing ? (
          <InputGroup className="w-[160px]">
            <InputGroupAddon>{CURRENCY_SYMBOL}</InputGroupAddon>
            <InputGroupInput
              type="number"
              min={0}
              placeholder="Rate"
              value={row.hourlyRate}
              onChange={(e) =>
                onHourlyRateInput(dayValue, row.id, e.target.value)
              }
            />
          </InputGroup>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onRowChange(dayValue, row.id, { allowPricing: true })
            }
          >
            Add pricing
          </Button>
        )}

        {/* Actions — pushed right */}
        <div className="flex items-center gap-1 ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Copy to all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Copy to all days?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will copy{" "}
                  <strong>
                    {formatMinutesAs12h(row.startTime)} –{" "}
                    {formatMinutesAs12h(row.endTime)}
                  </strong>
                  {row.allowPricing && row.hourlyRate !== "" && (
                    <>
                      {" "}
                      with pricing{" "}
                      <strong>
                        {CURRENCY_SYMBOL}
                        {row.hourlyRate}/hr
                      </strong>
                    </>
                  )}{" "}
                  to all other days. This will replace all existing blocks on
                  those days.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onApplyToAll(dayValue, row.id)}
                >
                  Copy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveRow(dayValue, row.id)}
            aria-label="Remove block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isLast && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onAddRow(dayValue)}
              aria-label="Add block"
            >
              <CirclePlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Issue labels */}
      {issueLabels.length > 0 && (
        <div
          className={cn(
            "text-xs",
            hasError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {issueLabels.join(" · ")}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */

interface CourtScheduleEditorProps {
  courtId: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  onSaved?: () => void;
}

export function CourtScheduleEditor({
  courtId,
  organizationId,
  primaryActionLabel = "Save schedule",
  onSaved,
}: CourtScheduleEditorProps) {
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [activeDay, setActiveDay] = React.useState<string>("");

  const {
    rowsByDay,
    isLoading,
    isSaving,
    isCopying,
    courts,
    validation,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleHourlyRateInput,
    handleApplyToAll,
    handleCopySchedule,
    handleSave,
  } = useCourtScheduleEditor({
    courtId,
    organizationId,
    onSaved,
    onCopyComplete: () => {
      setCopyOpen(false);
      setActiveDay("0");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
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
              Set opening hours and PHP rates for each day.
            </p>
          </div>
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
            Copy schedule from another venue
          </Button>
        </div>

        <div className="rounded-xl border p-2">
          <Accordion
            type="single"
            collapsible
            value={activeDay}
            onValueChange={(v) => setActiveDay(v)}
          >
            {DAY_OPTIONS.map((day) => {
              const dayRows = rowsByDay[day.value] ?? [];
              const hasSlots = dayRows.length > 0;

              const errorCount = dayRows.filter(
                (row) =>
                  validation.invalidRows.has(row.id) ||
                  validation.overlappingHours.has(row.id) ||
                  validation.overlappingPricing.has(row.id),
              ).length;
              const warningCount = dayRows.filter(
                (row) =>
                  validation.openWithoutPrice.has(row.id) ||
                  validation.overnightRows.has(row.id),
              ).length;

              const isExpanded = activeDay === String(day.value);

              return (
                <AccordionItem key={day.value} value={String(day.value)}>
                  <AccordionTrigger className="px-2 hover:no-underline">
                    <div className="flex items-center gap-3">
                      {/* Circular day badge */}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          hasSlots
                            ? "bg-teal-100 text-teal-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {DAY_INITIALS[day.value]}
                      </span>

                      {/* Day name + summary */}
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium">{day.label}</span>
                        {!isExpanded && hasSlots && (
                          <span className="text-xs text-muted-foreground">
                            {buildDaySummary(dayRows)}
                          </span>
                        )}
                        {!isExpanded && !hasSlots && (
                          <span className="text-xs text-muted-foreground italic">
                            Set a schedule
                          </span>
                        )}
                      </div>

                      {/* Validation badges */}
                      {errorCount > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          {errorCount} {errorCount === 1 ? "error" : "errors"}
                        </Badge>
                      )}
                      {warningCount > 0 && (
                        <Badge variant="warning" className="ml-1">
                          {warningCount}{" "}
                          {warningCount === 1 ? "warning" : "warnings"}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-2">
                    {dayRows.length === 0 ? (
                      <div className="flex justify-center py-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleAddRow(day.value)}
                        >
                          <CirclePlus className="mr-2 h-4 w-4" />
                          Add block
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayRows.map((row, idx) => {
                          const hasInvalidTime = validation.invalidRows.has(
                            row.id,
                          );
                          const overlapsHours = validation.overlappingHours.has(
                            row.id,
                          );
                          const overlapsPricing =
                            validation.overlappingPricing.has(row.id);
                          const missingPrice = validation.openWithoutPrice.has(
                            row.id,
                          );
                          const closedWithPrice =
                            validation.closedWithPrice.has(row.id);
                          const isOvernight = validation.overnightRows.has(
                            row.id,
                          );
                          const hasError =
                            hasInvalidTime || overlapsHours || overlapsPricing;

                          const issueLabels = [
                            hasInvalidTime ? "Invalid time" : null,
                            overlapsHours ? "Hours overlap" : null,
                            overlapsPricing ? "Pricing overlap" : null,
                            missingPrice ? "Needs price" : null,
                            closedWithPrice ? "Closed + priced" : null,
                            isOvernight ? "Overnight" : null,
                          ].filter(Boolean) as string[];

                          return (
                            <ScheduleSlotRow
                              key={row.id}
                              row={row}
                              dayValue={day.value}
                              isLast={idx === dayRows.length - 1}
                              hasError={hasError}
                              issueLabels={issueLabels}
                              validation={validation}
                              onRowChange={handleRowChange}
                              onHourlyRateInput={handleHourlyRateInput}
                              onApplyToAll={handleApplyToAll}
                              onRemoveRow={handleRemoveRow}
                              onAddRow={handleAddRow}
                            />
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving && <Spinner />}
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>

      <CourtConfigCopyDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        title="Copy schedule"
        description="Copy hours and pricing from another venue. This will replace the current schedule."
        courts={courts}
        currentCourtId={courtId}
        isSubmitting={isCopying}
        onConfirm={handleCopySchedule}
      />
    </Card>
  );
}
