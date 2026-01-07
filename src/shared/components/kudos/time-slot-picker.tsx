"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatTime } from "@/shared/lib/format";

export type TimeSlotStatus = "available" | "booked" | "selected" | "held";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  priceCents?: number;
  currency?: string;
  status: TimeSlotStatus;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedId?: string;
  onSelect?: (slot: TimeSlot) => void;
  showPrice?: boolean;
  className?: string;
}

export function TimeSlotPicker({
  slots,
  selectedId,
  onSelect,
  showPrice = false,
  className,
}: TimeSlotPickerProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2",
        className,
      )}
    >
      {slots.map((slot) => (
        <TimeSlotButton
          key={slot.id}
          slot={slot}
          isSelected={slot.id === selectedId}
          onClick={() => onSelect?.(slot)}
          showPrice={showPrice}
        />
      ))}
    </div>
  );
}

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onClick: () => void;
  showPrice?: boolean;
}

function TimeSlotButton({
  slot,
  isSelected,
  onClick,
  showPrice,
}: TimeSlotButtonProps) {
  const isAvailable = slot.status === "available";
  const isBooked = slot.status === "booked";
  const isHeld = slot.status === "held";
  const isDisabled = isBooked || isHeld;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all",
        // Available
        isAvailable &&
          !isSelected &&
          "bg-success/10 text-success border-success/20 hover:bg-success/20 hover:border-success/40",
        // Selected
        isSelected &&
          "bg-primary/10 text-primary border-primary ring-2 ring-primary/50",
        // Booked
        isBooked &&
          "bg-muted text-muted-foreground line-through cursor-not-allowed opacity-60",
        // Held
        isHeld &&
          "bg-warning/10 text-warning border-warning/20 cursor-not-allowed",
      )}
    >
      <span className="font-heading">
        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
      </span>
      {showPrice && slot.priceCents !== undefined && (
        <span className="text-xs mt-0.5 opacity-80">
          {formatCurrency(slot.priceCents, slot.currency || "PHP")}
        </span>
      )}
      {isHeld && <span className="text-xs mt-0.5">On hold</span>}
    </button>
  );
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
