"use client";

import { ChevronRight, X } from "lucide-react";
import * as React from "react";
import { formatTimeRangeInTimeZone } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { BlockInfoDisplay } from "./block-info-display";
import type { CourtBlockItem } from "./types";

export const MobileManageBlockPeekBar = React.memo(
  function MobileManageBlockPeekBar({
    block,
    timeZone,
    onDismiss,
    onRemove,
    onConvertWalkIn,
    onReplaceWithGuest,
    isImported,
    isCancelPending,
  }: {
    block: CourtBlockItem | null;
    timeZone: string;
    onDismiss: () => void;
    onRemove: (blockId: string) => void;
    onConvertWalkIn?: (blockId: string) => void;
    onReplaceWithGuest?: (blockId: string) => void;
    isImported?: boolean;
    isCancelPending: boolean;
  }) {
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    // Close drawer when block changes or is dismissed
    React.useEffect(() => {
      if (!block) setDrawerOpen(false);
    }, [block]);

    const isWalkIn = block?.type === "WALK_IN";

    const timeLabel = block
      ? formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)
      : "";

    return (
      <>
        {block && !drawerOpen && (
          <div className="fixed bottom-[calc(3.5rem+max(0px,env(safe-area-inset-bottom)))] left-0 right-0 z-50 border-t bg-background md:bottom-0 md:pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-200">
            <div className="flex w-full items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
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
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 rounded-full p-1.5 hover:bg-muted"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

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
              <div className="px-4 pb-4">
                <BlockInfoDisplay
                  block={block}
                  timeZone={timeZone}
                  isImported={isImported}
                />
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
                  {isCancelPending && <Spinner />} Remove block
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
                {isImported && onReplaceWithGuest && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (block) {
                        onReplaceWithGuest(block.id);
                        setDrawerOpen(false);
                        onDismiss();
                      }
                    }}
                  >
                    Replace with guest
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
