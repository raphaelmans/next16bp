"use client";

import { ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import {
  formatCurrency,
  formatDuration,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { CourtBlockItem } from "./types";
import { getMinuteOfDay } from "./types";

export const MobileManageBlockPeekBar = React.memo(
  function MobileManageBlockPeekBar({
    block,
    timeZone,
    onDismiss,
    onRemove,
    onConvertWalkIn,
    isCancelPending,
  }: {
    block: CourtBlockItem | null;
    timeZone: string;
    onDismiss: () => void;
    onRemove: (blockId: string) => void;
    onConvertWalkIn?: (blockId: string) => void;
    isCancelPending: boolean;
  }) {
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    // Close drawer when block changes or is dismissed
    React.useEffect(() => {
      if (!block) setDrawerOpen(false);
    }, [block]);

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
      <>
        <AnimatePresence>
          {block && !drawerOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Badge
                  variant={isWalkIn ? "paid" : "warning"}
                  className="shrink-0 text-[10px] px-1.5 py-0"
                >
                  {isWalkIn ? "Walk-in" : "Maintenance"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{timeLabel}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Manage
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="shrink-0 rounded-full p-1.5 hover:bg-muted"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Drawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) onDismiss();
          }}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Manage Block</DrawerTitle>
              <DrawerDescription>{timeLabel}</DrawerDescription>
            </DrawerHeader>
            {block && (
              <div className="px-4 pb-4 space-y-3">
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
                  <p className="text-sm text-muted-foreground">
                    {block.reason}
                  </p>
                )}
                {isWalkIn && block.totalPriceCents > 0 && (
                  <p className="text-sm font-medium">
                    {formatCurrency(block.totalPriceCents, block.currency)}
                  </p>
                )}
              </div>
            )}
            <DrawerFooter className="pb-safe">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isCancelPending}
                  onClick={() => {
                    if (block) {
                      onRemove(block.id);
                      setDrawerOpen(false);
                      onDismiss();
                    }
                  }}
                >
                  {isCancelPending ? "Removing..." : "Remove block"}
                </Button>
                {isWalkIn && onConvertWalkIn && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (block) {
                        onConvertWalkIn(block.id);
                        setDrawerOpen(false);
                        onDismiss();
                      }
                    }}
                  >
                    Convert to guest
                  </Button>
                )}
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  },
);
