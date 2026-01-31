"use client";

import { ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useBookingStudio } from "./booking-studio-provider";

export const MobileSelectionPeekBar = React.memo(
  function MobileSelectionPeekBar({
    selectedTimeLabel,
    onOpen,
  }: {
    selectedTimeLabel: string;
    onOpen: () => void;
  }) {
    const committedRange = useBookingStudio((s) => s.committedRange);
    const mobileDrawerOpen = useBookingStudio((s) => s.mobileDrawerOpen);
    const resetSelectionPanel = useBookingStudio((s) => s.resetSelectionPanel);

    const visible = !!committedRange && !mobileDrawerOpen;

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]"
          >
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedTimeLabel}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Create block
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSelectionPanel();
                }}
                className="shrink-0 rounded-full p-1.5 hover:bg-muted"
                aria-label="Dismiss selection"
              >
                <X className="h-4 w-4" />
              </button>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);
