"use client";

import {
  formatCurrency,
  formatTime,
  formatTimeInTimeZone,
} from "@/common/format";
import { cn } from "@/lib/utils";

export type TimeSlotStatus = "available" | "booked" | "selected" | "held";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  priceCents?: number;
  currency?: string;
  status: TimeSlotStatus;
  unavailableReason?: "RESERVATION" | "MAINTENANCE" | "WALK_IN";
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedId?: string;
  onSelect?: (slot: TimeSlot) => void;
  showPrice?: boolean;
  timeZone?: string;
  className?: string;
  renderSlotAction?: (args: {
    slot: TimeSlot;
    isSelected: boolean;
    isDisabled: boolean;
  }) => React.ReactNode;
}

export function TimeSlotPicker({
  slots,
  selectedId,
  onSelect,
  showPrice = false,
  timeZone,
  className,
  renderSlotAction,
}: TimeSlotPickerProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2",
        className,
      )}
    >
      {slots.map((slot) => {
        const isSelected = slot.id === selectedId;
        const { isDisabled } = getSlotState(slot);
        const action = renderSlotAction?.({ slot, isSelected, isDisabled });
        const button = (
          <TimeSlotButton
            slot={slot}
            isSelected={isSelected}
            onClick={() => onSelect?.(slot)}
            showPrice={showPrice}
            timeZone={timeZone}
          />
        );

        if (!action) {
          return (
            <div key={slot.id} className="contents">
              {button}
            </div>
          );
        }

        return (
          <div key={slot.id} className="flex flex-col gap-1">
            {button}
            <div className="flex justify-center">{action}</div>
          </div>
        );
      })}
    </div>
  );
}

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onClick: () => void;
  showPrice?: boolean;
  timeZone?: string;
}

function TimeSlotButton({
  slot,
  isSelected,
  onClick,
  showPrice,
  timeZone,
}: TimeSlotButtonProps) {
  const { isAvailable, isBooked, isHeld, isDisabled } = getSlotState(slot);
  const startLabel = timeZone
    ? formatTimeInTimeZone(slot.startTime, timeZone)
    : formatTime(slot.startTime);
  const endLabel = timeZone
    ? formatTimeInTimeZone(slot.endTime, timeZone)
    : formatTime(slot.endTime);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all w-full",
        // Available
        isAvailable &&
          !isSelected &&
          "bg-success/10 text-success border-success/20 hover:bg-success/20 hover:border-success/40",
        // Selected
        isSelected &&
          "bg-primary/10 text-primary border-primary ring-2 ring-primary/50",
        // Booked
        isBooked &&
          "bg-muted/60 text-muted-foreground border-border/60 cursor-not-allowed",
        // Held
        isHeld &&
          "bg-warning/10 text-warning border-warning/20 cursor-not-allowed",
      )}
    >
      <span className="font-heading">
        {startLabel} - {endLabel}
      </span>
      {showPrice && slot.priceCents !== undefined && (
        <span className="text-xs mt-0.5 opacity-80">
          {formatCurrency(slot.priceCents, slot.currency || "PHP")}
        </span>
      )}
      {isBooked && (
        <span className="text-xs mt-0.5">
          {getUnavailableLabel(slot.unavailableReason)}
        </span>
      )}
      {isHeld && <span className="text-xs mt-0.5">On hold</span>}
    </button>
  );
}

function getSlotState(slot: TimeSlot) {
  const isAvailable = slot.status === "available";
  const isBooked = slot.status === "booked";
  const isHeld = slot.status === "held";
  const isDisabled = isBooked || isHeld;
  return { isAvailable, isBooked, isHeld, isDisabled };
}

function getUnavailableLabel(reason?: TimeSlot["unavailableReason"]): string {
  if (reason === "MAINTENANCE") return "Maintenance";
  return "Booked";
}

const SKELETON_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

export function TimeSlotPickerSkeleton({ count = 8 }: { count?: number }) {
  const ids = SKELETON_IDS.slice(0, count);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {ids.map((id) => (
        <div key={id} className="h-16 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
