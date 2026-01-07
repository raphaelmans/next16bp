"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type SlotStatus = "available" | "booked" | "pending" | "blocked";

export interface TimeSlot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  durationMinutes: number;
  status: SlotStatus;
  priceCents?: number;
  currency?: string;
  playerName?: string;
  playerPhone?: string;
}

interface UseSlotsOptions {
  courtId: string;
  date?: Date;
}

// Mock data generator
const generateMockSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const baseDate = new Date(date);
  baseDate.setHours(6, 0, 0, 0);

  const statuses: SlotStatus[] = ["available", "booked", "pending", "blocked"];
  const playerNames = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Wilson",
  ];

  for (let i = 0; i < 16; i++) {
    const startTime = new Date(baseDate);
    startTime.setHours(6 + i);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    const status = statuses[i % 4];

    slots.push({
      id: `slot-${i}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: 60,
      status,
      priceCents: status !== "blocked" ? 50000 : undefined,
      currency: "PHP",
      playerName:
        status === "booked" || status === "pending"
          ? playerNames[i % 4]
          : undefined,
      playerPhone:
        status === "booked" || status === "pending"
          ? "0917123456" + i
          : undefined,
    });
  }

  return slots;
};

export function useSlots({ courtId, date }: UseSlotsOptions) {
  return useQuery({
    queryKey: ["owner", "slots", courtId, date?.toISOString()],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockSlots(date ?? new Date());
    },
    enabled: !!courtId,
  });
}

export function useBlockSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }: { slotId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, slotId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}

export function useUnblockSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }: { slotId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, slotId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }: { slotId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, slotId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }: { slotId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, slotId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      reason,
    }: {
      slotId: string;
      reason: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, slotId, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}

export interface BulkSlotData {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  duration: number;
  useDefaultPrice: boolean;
  customPrice?: number;
}

export function useCreateBulkSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkSlotData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Calculate number of slots
      const slotsPerDay = Math.floor(
        ((parseInt(data.endTime.split(":")[0]) -
          parseInt(data.startTime.split(":")[0])) *
          60) /
          data.duration,
      );
      const days = data.endDate
        ? Math.ceil(
            (data.endDate.getTime() - data.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1
        : 1;
      return { success: true, slotsCreated: slotsPerDay * days };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}
