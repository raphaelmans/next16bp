"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { useTRPC, useTRPCClient } from "@/trpc/client";

export type SlotStatus = "available" | "booked" | "pending" | "blocked";

export interface TimeSlot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  durationMinutes: number;
  status: SlotStatus;
  priceCents?: number | null;
  currency?: string | null;
  playerName?: string | null;
  playerPhone?: string | null;
  reservationId?: string | null;
  reservationStatus?:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED"
    | null;
  reservationExpiresAt?: string | null;
}

interface UseSlotsOptions {
  courtId: string;
  date?: Date;
}

/**
 * Map backend status (UPPERCASE) to frontend status (lowercase)
 */
function mapStatusFromBackend(
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
): SlotStatus {
  const map: Record<string, SlotStatus> = {
    AVAILABLE: "available",
    HELD: "pending",
    BOOKED: "booked",
    BLOCKED: "blocked",
  };
  return map[status] ?? "available";
}

/**
 * Calculate duration in minutes from start/end times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function useSlots({ courtId, date }: UseSlotsOptions) {
  const trpc = useTRPC();

  const selectedDate = date ?? new Date();
  const startDate = startOfDay(selectedDate);
  const endDate = endOfDay(selectedDate);

  return useQuery({
    ...trpc.timeSlot.getForCourt.queryOptions({
      courtId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    enabled: !!courtId,
    select: (data): TimeSlot[] =>
      data.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: calculateDuration(
          slot.startTime as string,
          slot.endTime as string,
        ),
        status: mapStatusFromBackend(slot.status),
        priceCents: slot.priceCents,
        currency: slot.currency,
        playerName: slot.playerName,
        playerPhone: slot.playerPhone,
        reservationId: slot.reservationId ?? null,
        reservationStatus: slot.reservationStatus ?? null,
        reservationExpiresAt: slot.reservationExpiresAt ?? null,
      })),
  });
}

export function useBlockSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.block.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
    },
  });
}

export function useUnblockSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.unblock.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
    },
  });
}

export function useDeleteSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
    },
  });
}

export interface BulkSlotData {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  duration: number; // minutes
  useDefaultPrice: boolean;
  customPrice?: number;
  currency?: string;
}

/**
 * Generate slot array from bulk configuration
 */
function generateSlotsFromBulkData(
  _courtId: string,
  data: BulkSlotData,
): Array<{
  startTime: string;
  endTime: string;
  priceCents: number | null;
  currency: string | null;
}> {
  const slots: Array<{
    startTime: string;
    endTime: string;
    priceCents: number | null;
    currency: string | null;
  }> = [];

  const startDateObj = new Date(data.startDate);
  const endDateObj = data.endDate ? new Date(data.endDate) : startDateObj;

  // Parse time strings
  const [startHour, startMin] = data.startTime.split(":").map(Number);
  const [endHour, endMin] = data.endTime.split(":").map(Number);

  // Iterate through dates
  const currentDate = new Date(startDateObj);
  while (currentDate <= endDateObj) {
    // Check if day of week matches (if specified)
    if (
      !data.daysOfWeek ||
      data.daysOfWeek.length === 0 ||
      data.daysOfWeek.includes(currentDate.getDay())
    ) {
      // Generate slots for this day
      let slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + data.duration * 60000);
        if (slotEnd <= dayEnd) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            priceCents: data.useDefaultPrice
              ? null
              : data.customPrice
                ? Math.round(data.customPrice * 100)
                : null,
            currency: data.useDefaultPrice ? null : (data.currency ?? null),
          });
        }
        slotStart = slotEnd;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

export function useCreateBulkSlots(courtId: string) {
  const client = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkSlotData) => {
      const slots = generateSlotsFromBulkData(courtId, data);

      if (slots.length === 0) {
        throw new Error("No slots to create with the given configuration");
      }

      if (slots.length > 100) {
        throw new Error("Maximum 100 slots can be created at once");
      }

      // Call the tRPC mutation directly
      const result = await client.timeSlot.createBulk.mutate({
        courtId,
        slots,
      });

      return { success: true, slotsCreated: result.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
    },
  });
}

// DEFERRED: These will be wired in 07-owner-confirmation
// They call reservation endpoints, not time-slot endpoints

export function useConfirmBooking() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.confirmPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
      queryClient.invalidateQueries(
        trpc.reservationOwner.getForOrganization.queryFilter(),
      );
    },
  });
}

export function useRejectBooking() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.timeSlot.getForCourt.queryFilter());
      queryClient.invalidateQueries(
        trpc.reservationOwner.getForOrganization.queryFilter(),
      );
    },
  });
}
