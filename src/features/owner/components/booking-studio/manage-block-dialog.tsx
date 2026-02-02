"use client";

import {
  formatCurrency,
  formatDuration,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CourtBlockItem } from "./types";
import { getMinuteOfDay } from "./types";

export function ManageBlockDialog({
  block,
  timeZone,
  onClose,
  onRemove,
  onConvertWalkIn,
  onReplaceWithGuest,
  isImported,
}: {
  block: CourtBlockItem | null;
  timeZone: string;
  onClose: () => void;
  onRemove: (blockId: string) => void;
  onConvertWalkIn?: (blockId: string) => void;
  onReplaceWithGuest?: (blockId: string) => void;
  isImported?: boolean;
}) {
  const isWalkIn = block?.type === "WALK_IN";

  const durationMinutes = block
    ? Math.max(
        getMinuteOfDay(block.endTime, timeZone) -
          getMinuteOfDay(block.startTime, timeZone),
        0,
      )
    : 0;

  const timeLabel = block
    ? formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)
    : "";

  return (
    <Dialog
      open={!!block}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Block</DialogTitle>
          <DialogDescription>{timeLabel}</DialogDescription>
        </DialogHeader>
        {block && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={isWalkIn ? "paid" : "warning"}
                className="text-[10px] px-1.5 py-0"
              >
                {isWalkIn ? "Walk-in" : "Maintenance"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDuration(durationMinutes)}
              </span>
            </div>
            {block.reason && (
              <p className="text-sm text-muted-foreground">{block.reason}</p>
            )}
            {isWalkIn && block.totalPriceCents > 0 && (
              <p className="text-sm font-medium">
                {formatCurrency(block.totalPriceCents, block.currency)}
              </p>
            )}
            {isImported && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Imported
              </Badge>
            )}
          </div>
        )}
        <DialogFooter className="flex-row gap-2 sm:justify-start">
          <Button
            variant="destructive"
            onClick={() => {
              if (block) {
                onRemove(block.id);
                onClose();
              }
            }}
          >
            Remove block
          </Button>
          {isWalkIn && onConvertWalkIn && (
            <Button
              variant="outline"
              onClick={() => {
                if (block) {
                  onConvertWalkIn(block.id);
                  onClose();
                }
              }}
            >
              Convert to guest
            </Button>
          )}
          {isImported && onReplaceWithGuest && (
            <Button
              variant="outline"
              onClick={() => {
                if (block) {
                  onReplaceWithGuest(block.id);
                  onClose();
                }
              }}
            >
              Replace with guest
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
