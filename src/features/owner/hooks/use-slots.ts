"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMinutes } from "date-fns";
import {
  getZonedDate,
  getZonedDayRangeForInstant,
  getZonedToday,
} from "@/shared/lib/time-zone";
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
  timeZone?: string;
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

export const MAX_BULK_SLOTS = 100;

export function useSlots({ courtId, date, timeZone }: UseSlotsOptions) {
  const trpc = useTRPC();

  const selectedDate = date ?? getZonedToday(timeZone);
  const dayRange = getZonedDayRangeForInstant(selectedDate, timeZone);
  const startDate = dayRange.start;
  const endDate = dayRange.end;

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

export type CourtHoursWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export interface BulkSlotData {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  duration: number; // minutes
  useDefaultPrice: boolean;
  customPrice?: number;
  currency?: string;
  hoursWindows: CourtHoursWindow[];
  timeZone?: string;
}

type SlotPayload = {
  startTime: string;
  endTime: string;
  priceCents?: number | null;
  currency?: string | null;
};

export type BulkSlotPreview = {
  slots: SlotPayload[];
  totalGenerated: number;
  totalDaysWithSlots: number;
  wasTrimmed: boolean;
};

/**
 * Generate slot array from court hours windows
 */
export function generateSlotsFromCourtHours(
  data: BulkSlotData,
): BulkSlotPreview {
  const slots: SlotPayload[] = [];
  const daysWithSlots = new Set<string>();

  const rangeStart = getZonedDayRangeForInstant(
    data.startDate,
    data.timeZone,
  ).start;
  const rangeEnd = getZonedDayRangeForInstant(
    data.endDate ?? data.startDate,
    data.timeZone,
  ).start;

  const currentDate = getZonedDate(rangeStart, data.timeZone);
  while (currentDate <= rangeEnd) {
    const dayOfWeek = currentDate.getDay();
    const isSelectedDay = data.daysOfWeek
      ? data.daysOfWeek.includes(dayOfWeek)
      : true;

    if (isSelectedDay) {
      const dayWindows = data.hoursWindows
        .filter((window) => window.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startMinute - b.startMinute);

      let daySlotCount = 0;
      for (const window of dayWindows) {
        for (
          let minute = window.startMinute;
          minute + data.duration <= window.endMinute;
          minute += data.duration
        ) {
          const slotStart = getZonedDate(currentDate, data.timeZone);
          slotStart.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
          const slotEnd = addMinutes(slotStart, data.duration);

          const slot: SlotPayload = {
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
          };

          if (!data.useDefaultPrice) {
            if (data.customPrice !== undefined && data.customPrice !== null) {
              slot.priceCents = Math.round(data.customPrice * 100);
              slot.currency = data.currency ?? null;
            } else {
              slot.priceCents = null;
              slot.currency = null;
            }
          }

          slots.push(slot);
          daySlotCount += 1;
        }
      }

      if (daySlotCount > 0) {
        daysWithSlots.add(currentDate.toDateString());
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalGenerated = slots.length;
  const wasTrimmed = totalGenerated > MAX_BULK_SLOTS;
  const trimmedSlots = wasTrimmed ? slots.slice(0, MAX_BULK_SLOTS) : slots;

  return {
    slots: trimmedSlots,
    totalGenerated,
    totalDaysWithSlots: daysWithSlots.size,
    wasTrimmed,
  };
}

export function useCreateBulkSlots(courtId: string) {
  const client = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkSlotData) => {
      const { slots, totalGenerated, wasTrimmed } =
        generateSlotsFromCourtHours(data);

      if (slots.length === 0) {
        throw new Error("No slots to create with the given configuration");
      }

      // Call the tRPC mutation directly
      const result = await client.timeSlot.createBulk.mutate({
        courtId,
        slots,
      });

      return {
        success: true,
        slotsCreated: result.length,
        totalGenerated,
        wasTrimmed,
      };
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
