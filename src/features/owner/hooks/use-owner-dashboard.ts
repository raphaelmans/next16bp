"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Mock data for owner dashboard.
 * Replace with actual tRPC queries when backend is ready.
 */
const mockDashboardData = {
  stats: {
    activeCourts: 3,
    pendingBookings: 5,
    todaysBookings: 8,
    monthlyRevenue: 45000, // in cents
  },
  recentActivity: [
    {
      id: "1",
      type: "booking" as const,
      title: "New booking received",
      description: "Court A - John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
      id: "2",
      type: "payment" as const,
      title: "Payment confirmed",
      description: "Court B - Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      type: "confirmed" as const,
      title: "Booking confirmed",
      description: "Court A - Mike Johnson",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
  ],
  todaysBookings: [
    {
      id: "1",
      startTime: new Date(new Date().setHours(6, 0, 0, 0)),
      endTime: new Date(new Date().setHours(7, 0, 0, 0)),
      status: "booked" as const,
      playerName: "John Doe",
      courtName: "Court A",
    },
    {
      id: "2",
      startTime: new Date(new Date().setHours(7, 0, 0, 0)),
      endTime: new Date(new Date().setHours(8, 0, 0, 0)),
      status: "pending" as const,
      playerName: "Jane Smith",
      courtName: "Court A",
    },
    {
      id: "3",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(9, 0, 0, 0)),
      status: "available" as const,
      courtName: "Court A",
    },
    {
      id: "4",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      status: "blocked" as const,
      courtName: "Court A",
    },
  ],
};

export function useOwnerDashboard() {
  // TODO: Replace with actual tRPC query when backend is ready
  // const trpc = useTRPC();
  // return trpc.owner.dashboard.useQuery();

  return useQuery({
    queryKey: ["owner", "dashboard"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboardData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOwnerStats() {
  const { data, ...rest } = useOwnerDashboard();
  return {
    data: data?.stats,
    ...rest,
  };
}

export function useRecentActivity() {
  const { data, ...rest } = useOwnerDashboard();
  return {
    data: data?.recentActivity ?? [],
    ...rest,
  };
}

export function useTodaysBookings() {
  const { data, ...rest } = useOwnerDashboard();
  return {
    data: data?.todaysBookings ?? [],
    ...rest,
  };
}
