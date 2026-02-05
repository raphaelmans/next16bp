"use client";

import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
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
import { cn } from "@/lib/utils";
import { CourtConfigCopyDialog } from "./court-config-copy-dialog";
import { CURRENCY_OPTIONS, DAY_OPTIONS } from "./court-schedule-editor/helpers";
import { useCourtScheduleEditor } from "./court-schedule-editor/hooks";

interface CourtScheduleEditorProps {
  courtId: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  timeZone?: string | null;
  onSaved?: () => void;
}

export function CourtScheduleEditor({
  courtId,
  organizationId,
  primaryActionLabel = "Save schedule",
  timeZone,
  onSaved,
}: CourtScheduleEditorProps) {
  const [copyOpen, setCopyOpen] = React.useState(false);
  const {
    rowsByDay,
    openDays,
    setOpenDays,
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
    onCopyComplete: () => setCopyOpen(false),
  });

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
                        {/* Mobile card layout */}
                        <div className="md:hidden space-y-3">
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
                              <div
                                key={row.id}
                                className={cn(
                                  "rounded-lg border p-3 space-y-3",
                                  hasError &&
                                    "border-destructive bg-destructive/5",
                                )}
                              >
                                <div className="space-y-2">
                                  <div>
                                    <label
                                      htmlFor={`start-${day.value}-${row.id}`}
                                      className="text-xs text-muted-foreground mb-1 block"
                                    >
                                      Start
                                    </label>
                                    <Input
                                      id={`start-${day.value}-${row.id}`}
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
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`end-${day.value}-${row.id}`}
                                      className="text-xs text-muted-foreground mb-1 block"
                                    >
                                      End
                                    </label>
                                    <Input
                                      id={`end-${day.value}-${row.id}`}
                                      type="time"
                                      value={
                                        row.endTime === "24:00"
                                          ? "00:00"
                                          : row.endTime
                                      }
                                      onChange={(event) =>
                                        handleRowChange(day.value, row.id, {
                                          endTime:
                                            event.target.value === "00:00"
                                              ? "24:00"
                                              : event.target.value,
                                        })
                                      }
                                      className={cn(
                                        hasError &&
                                          "border-destructive focus-visible:ring-destructive/40",
                                      )}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 items-end">
                                  <div>
                                    <label
                                      htmlFor={`status-${day.value}-${row.id}`}
                                      className="text-xs text-muted-foreground mb-1 block"
                                    >
                                      Status
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        id={`status-${day.value}-${row.id}`}
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
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`currency-${day.value}-${row.id}`}
                                      className="text-xs text-muted-foreground mb-1 block"
                                    >
                                      Currency
                                    </label>
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
                                  </div>
                                </div>

                                <div>
                                  <label
                                    htmlFor={`rate-${day.value}-${row.id}`}
                                    className="text-xs text-muted-foreground mb-1 block"
                                  >
                                    Hourly rate
                                  </label>
                                  {row.allowPricing ? (
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        id={`rate-${day.value}-${row.id}`}
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
                                          handleApplyToAll(day.value, row.id)
                                        }
                                      >
                                        Copy to all
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
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    {issueLabels.length > 0 && (
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
                                    )}
                                  </div>
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
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop table layout */}
                        <Table className="hidden md:table">
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
                                      value={
                                        row.endTime === "24:00"
                                          ? "00:00"
                                          : row.endTime
                                      }
                                      onChange={(event) =>
                                        handleRowChange(day.value, row.id, {
                                          endTime:
                                            event.target.value === "00:00"
                                              ? "24:00"
                                              : event.target.value,
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
                                            handleApplyToAll(day.value, row.id)
                                          }
                                        >
                                          Copy to all
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
