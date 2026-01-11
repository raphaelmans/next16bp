"use client";

import { format } from "date-fns";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeSlot } from "../hooks/use-slots";
import { SlotItem } from "./slot-item";

interface SlotListProps {
  date: Date;
  slots: TimeSlot[];
  isLoading?: boolean;
  onAddSlot?: () => void;
  onBlockSlot?: (slotId: string) => void;
  onUnblockSlot?: (slotId: string) => void;
  onDeleteSlot?: (slotId: string) => void;
  onConfirmBooking?: (reservationId: string) => void;
  onRejectBooking?: (reservationId: string) => void;
  onCancelBooking?: (reservationId: string) => void;
  actionLoadingId?: string;
}

export function SlotList({
  date,
  slots,
  isLoading,
  onAddSlot,
  onBlockSlot,
  onUnblockSlot,
  onDeleteSlot,
  onConfirmBooking,
  onRejectBooking,
  onCancelBooking,
  actionLoadingId,
}: SlotListProps) {
  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();
    return aTime - bTime;
  });

  // Group slots by hour for potential gap detection
  const _slotsByHour = sortedSlots.reduce(
    (acc, slot) => {
      const hour = new Date(slot.startTime).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(slot);
      return acc;
    },
    {} as Record<number, TimeSlot[]>,
  );

  // Calculate stats
  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === "available").length,
    booked: slots.filter((s) => s.status === "booked").length,
    pending: slots.filter((s) => s.status === "pending").length,
    blocked: slots.filter((s) => s.status === "blocked").length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Slots for {format(date, "EEEE, MMMM d")}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} slots &middot; {stats.available} available &middot;{" "}
            {stats.booked} booked
            {stats.pending > 0 && (
              <span className="text-yellow-600">
                {" "}
                &middot; {stats.pending} pending
              </span>
            )}
          </p>
        </div>
        <Button onClick={onAddSlot} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Slots
        </Button>
      </CardHeader>
      <CardContent>
        {sortedSlots.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No slots for this day</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create time slots to start accepting bookings
            </p>
            <Button onClick={onAddSlot} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Slot
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSlots.map((slot) => (
              <SlotItem
                key={slot.id}
                slot={slot}
                onBlock={onBlockSlot}
                onUnblock={onUnblockSlot}
                onDelete={onDeleteSlot}
                onConfirm={onConfirmBooking}
                onReject={onRejectBooking}
                onCancel={onCancelBooking}
                isLoading={
                  actionLoadingId === slot.id ||
                  actionLoadingId === slot.reservationId
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
