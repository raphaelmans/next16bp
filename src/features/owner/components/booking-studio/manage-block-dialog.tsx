"use client";

import * as React from "react";
import { formatTimeRangeInTimeZone } from "@/common/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockInfoDisplay } from "./block-info-display";
import type { CourtBlockItem } from "./types";

export const ManageBlockDialog = React.memo(function ManageBlockDialog({
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
          <BlockInfoDisplay
            block={block}
            timeZone={timeZone}
            isImported={isImported}
          />
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
});
