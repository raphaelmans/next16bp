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
import { Textarea } from "@/components/ui/textarea";
import {
  addDays,
  buildDateRangeIso,
  createLocalEditorId,
  formatBlockDateTime,
  formatDateInputValue,
  formatDateTimeInputValue,
  localDateTimeInputToIso,
} from "@/features/coach/helpers";
import {
  useMutCoachCreateBlock,
  useMutCoachDeleteBlock,
  useQueryCoachBlocks,
} from "@/features/coach/hooks";

const BLOCK_TYPE_OPTIONS = [
  { value: "PERSONAL", label: "Personal" },
  { value: "EXTERNAL_BOOKING", label: "External booking" },
  { value: "OTHER", label: "Other" },
] as const;

type BlockTypeValue = (typeof BLOCK_TYPE_OPTIONS)[number]["value"];

function buildDefaultBlockDraft(): {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
  blockType: BlockTypeValue;
} {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    id: createLocalEditorId(),
    startTime: formatDateTimeInputValue(start),
    endTime: formatDateTimeInputValue(end),
    reason: "",
    blockType: "PERSONAL",
  };
}

export function CoachBlockManager({ coachId }: { coachId: string }) {
  const today = React.useMemo(() => new Date(), []);
  const [startDate, setStartDate] = React.useState(formatDateInputValue(today));
  const [endDate, setEndDate] = React.useState(
    formatDateInputValue(addDays(today, 14)),
  );
  const [draft, setDraft] = React.useState(buildDefaultBlockDraft);

  const range = React.useMemo(
    () => buildDateRangeIso(startDate, endDate),
    [endDate, startDate],
  );
  const hasValidRange = startDate <= endDate;

  const { data: blocks = [], isLoading } = useQueryCoachBlocks(coachId, range, {
    enabled: hasValidRange,
  });
  const createBlock = useMutCoachCreateBlock(range);
  const deleteBlock = useMutCoachDeleteBlock(range);

  const handleCreate = () => {
    if (!draft.startTime || !draft.endTime) {
      toast.error("Select both a start and an end time.");
      return;
    }

    if (draft.startTime >= draft.endTime) {
      toast.error("Block end time must be after the start time.");
      return;
    }

    createBlock.mutate(
      {
        coachId,
        startTime: localDateTimeInputToIso(draft.startTime),
        endTime: localDateTimeInputToIso(draft.endTime),
        reason: draft.reason.trim() || undefined,
        blockType: draft.blockType,
      },
      {
        onSuccess: () => {
          toast.success("Coach block created");
          setDraft(buildDefaultBlockDraft());
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create block");
        },
      },
    );
  };

  const handleDelete = (blockId: string) => {
    deleteBlock.mutate(
      {
        coachId,
        blockId,
      },
      {
        onSuccess: () => {
          toast.success("Coach block removed");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove block");
        },
      },
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="font-heading text-xl">Ad-hoc blocks</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use blocks for personal time, external bookings, or one-off closures
          that should temporarily remove availability from your calendar.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section className="grid gap-4 rounded-xl border p-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coach-block-range-start">View from</Label>
            <Input
              id="coach-block-range-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-block-range-end">View to</Label>
            <Input
              id="coach-block-range-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </section>

        {!hasValidRange ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            The range end date must be on or after the start date.
          </p>
        ) : isLoading ? (
          <div className="flex min-h-[8rem] items-center justify-center rounded-xl border bg-muted/20">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No blocks in this date range yet.
          </p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {formatBlockDateTime(block.startTime)} to{" "}
                    {formatBlockDateTime(block.endTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {BLOCK_TYPE_OPTIONS.find(
                      (option) => option.value === block.blockType,
                    )?.label ?? block.blockType}
                  </p>
                  {block.reason ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {block.reason}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(block.id)}
                  disabled={deleteBlock.isPending}
                  aria-label="Delete coach block"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <section className="space-y-4 rounded-xl border p-4">
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">Create a block</h3>
            <p className="text-sm text-muted-foreground">
              Add a single closure window when you need to override your weekly
              availability.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coach-block-start">Start</Label>
              <Input
                id="coach-block-start"
                type="datetime-local"
                value={draft.startTime}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-block-end">End</Label>
              <Input
                id="coach-block-end"
                type="datetime-local"
                value={draft.endTime}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={draft.blockType}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    blockType:
                      value as (typeof BLOCK_TYPE_OPTIONS)[number]["value"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select block type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach-block-reason">Reason</Label>
              <Textarea
                id="coach-block-reason"
                value={draft.reason}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Optional note for why this time is blocked"
                rows={3}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={createBlock.isPending}
          >
            {createBlock.isPending ? (
              <Spinner className="mr-2 size-4 text-current" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Create block
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
