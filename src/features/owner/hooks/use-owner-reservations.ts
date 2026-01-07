"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

interface UseOwnerReservationsOptions {
  courtId?: string;
  status?: ReservationStatus | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Mock data generator
const generateMockReservations = (): Reservation[] => {
  const statuses: ReservationStatus[] = [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ];
  const courts = [
    { id: "court-1", name: "Court A" },
    { id: "court-2", name: "Court B" },
    { id: "court-3", name: "Court C" },
  ];
  const players = [
    { name: "John Doe", email: "john@example.com", phone: "09171234567" },
    { name: "Jane Smith", email: "jane@example.com", phone: "09181234567" },
    { name: "Mike Johnson", email: "mike@example.com", phone: "09191234567" },
    { name: "Sarah Wilson", email: "sarah@example.com", phone: "09201234567" },
    { name: "David Brown", email: "david@example.com", phone: "09211234567" },
  ];

  const reservations: Reservation[] = [];
  const today = new Date();

  for (let i = 0; i < 25; i++) {
    const court = courts[i % courts.length];
    const player = players[i % players.length];
    const status = statuses[i % statuses.length];
    const daysOffset = Math.floor(i / 5) - 2; // Some past, some future
    const date = new Date(today);
    date.setDate(date.getDate() + daysOffset);

    const hour = 6 + (i % 12);

    reservations.push({
      id: `reservation-${i}`,
      courtId: court.id,
      courtName: court.name,
      playerName: player.name,
      playerEmail: player.email,
      playerPhone: player.phone,
      date: date.toISOString().split("T")[0],
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      amountCents: 50000 + (i % 3) * 10000,
      currency: "PHP",
      status,
      paymentReference:
        status === "pending" || status === "confirmed"
          ? `GC${Date.now()}${i}`
          : undefined,
      paymentProofUrl:
        status === "pending"
          ? "https://placehold.co/400x600?text=Receipt"
          : undefined,
      notes: i % 3 === 0 ? "Please prepare the court early" : undefined,
      createdAt: new Date(today.getTime() - i * 3600000).toISOString(),
    });
  }

  return reservations;
};

export function useOwnerReservations(
  options: UseOwnerReservationsOptions = {},
) {
  const { courtId, status, search, dateFrom, dateTo } = options;

  return useQuery({
    queryKey: [
      "owner",
      "reservations",
      courtId,
      status,
      search,
      dateFrom?.toISOString(),
      dateTo?.toISOString(),
    ],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let reservations = generateMockReservations();

      // Apply filters
      if (courtId) {
        reservations = reservations.filter((r) => r.courtId === courtId);
      }
      if (status && status !== "all") {
        reservations = reservations.filter((r) => r.status === status);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        reservations = reservations.filter(
          (r) =>
            r.playerName.toLowerCase().includes(searchLower) ||
            r.playerEmail.toLowerCase().includes(searchLower) ||
            r.playerPhone.includes(search),
        );
      }
      if (dateFrom) {
        reservations = reservations.filter((r) => new Date(r.date) >= dateFrom);
      }
      if (dateTo) {
        reservations = reservations.filter((r) => new Date(r.date) <= dateTo);
      }

      return reservations;
    },
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId }: { reservationId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, reservationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "reservations"] });
    },
  });
}

export function useRejectReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId,
      reason,
    }: {
      reservationId: string;
      reason: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, reservationId, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "reservations"] });
    },
  });
}

// Helper to get count by status
export function useReservationCounts() {
  return useQuery({
    queryKey: ["owner", "reservations", "counts"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const reservations = generateMockReservations();
      return {
        pending: reservations.filter((r) => r.status === "pending").length,
        confirmed: reservations.filter((r) => r.status === "confirmed").length,
        cancelled: reservations.filter((r) => r.status === "cancelled").length,
        completed: reservations.filter((r) => r.status === "completed").length,
        total: reservations.length,
      };
    },
  });
}
