"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  KudosDatePicker,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
  type TimeSlot,
} from "@/shared/components/kudos";
import { formatCurrency } from "@/shared/lib/format";

interface BookingCardProps {
  courtId: string;
  pricePerHourCents?: number;
  currency?: string;
  slots?: TimeSlot[];
  isLoadingSlots?: boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  selectedSlotId?: string;
  onSlotSelect?: (slot: TimeSlot) => void;
  className?: string;
}

export function BookingCard({
  courtId,
  pricePerHourCents,
  currency = "PHP",
  slots = [],
  isLoadingSlots = false,
  selectedDate,
  onDateChange,
  selectedSlotId,
  onSlotSelect,
  className,
}: BookingCardProps) {
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          {pricePerHourCents !== undefined ? (
            <>
              <span className="font-heading text-2xl font-bold">
                {formatCurrency(pricePerHourCents, currency)}
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                /hour
              </span>
            </>
          ) : (
            <span className="font-heading text-2xl font-bold text-success">
              Free
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Select Date</p>
          <KudosDatePicker
            value={selectedDate}
            onChange={onDateChange}
            placeholder="Choose a date"
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Times</p>
            {isLoadingSlots ? (
              <TimeSlotPickerSkeleton count={6} />
            ) : slots.length > 0 ? (
              <TimeSlotPicker
                slots={slots}
                selectedId={selectedSlotId}
                onSelect={onSlotSelect}
                showPrice={true}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available slots for this date
              </p>
            )}
          </div>
        )}

        {/* Reserve Button */}
        <Button
          size="lg"
          className="w-full"
          disabled={!selectedSlot}
          asChild={!!selectedSlot}
        >
          {selectedSlot ? (
            <Link href={`/courts/${courtId}/book/${selectedSlot.id}`}>
              Reserve Now
            </Link>
          ) : (
            <span>Select a time slot</span>
          )}
        </Button>

        {/* Summary */}
        {selectedSlot && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Slot price</span>
              <span>
                {formatCurrency(selectedSlot.priceCents || 0, currency)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>
                {formatCurrency(selectedSlot.priceCents || 0, currency)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
