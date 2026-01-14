"use client";

import { CalendarDays, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { appRoutes } from "@/shared/lib/app-routes";
import { useMyReservations } from "../hooks/use-my-reservations";
import {
  type ReservationTab,
  useReservationsTabs,
} from "../hooks/use-reservations-tabs";
import { ReservationListItem } from "./reservation-list-item";
import { ReservationListSkeleton } from "./skeletons";

const emptyStateConfig: Record<
  ReservationTab,
  { title: string; description: string }
> = {
  upcoming: {
    title: "No Upcoming Reservations",
    description:
      "You don't have any upcoming court reservations. Find a court and book a slot to get started!",
  },
  past: {
    title: "No Past Reservations",
    description:
      "You don't have any past reservations yet. Your completed bookings will appear here.",
  },
  cancelled: {
    title: "No Cancelled Reservations",
    description:
      "You don't have any cancelled reservations. That's a good thing!",
  },
};

interface ReservationListProps {
  tab?: ReservationTab;
  isActive?: boolean;
}

export function ReservationList({ tab, isActive }: ReservationListProps) {
  const { tab: activeTab } = useReservationsTabs();
  const effectiveTab = tab ?? activeTab;
  const isEnabled = isActive ?? effectiveTab === activeTab;
  const { data, isLoading, isError } = useMyReservations({
    tab: effectiveTab,
    enabled: isEnabled,
  });

  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return <ReservationListSkeleton />;
  }

  if (isError) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>Failed to load reservations</EmptyTitle>
          <EmptyDescription>
            Something went wrong while loading your reservations. Please try
            again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const reservations = data?.items ?? [];

  if (reservations.length === 0) {
    const emptyState = emptyStateConfig[effectiveTab];
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
          <EmptyDescription>{emptyState.description}</EmptyDescription>
        </EmptyHeader>
        {effectiveTab === "upcoming" && (
          <EmptyContent>
            <Button asChild>
              <Link href={appRoutes.courts.base}>
                <Search className="mr-2 h-4 w-4" />
                Find Courts
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationListItem key={reservation.id} reservation={reservation} />
      ))}
    </div>
  );
}
