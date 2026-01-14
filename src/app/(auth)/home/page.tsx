"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/features/auth/hooks/use-auth";
import {
  OrganizationSection,
  ProfileCompletionBanner,
  QuickActions,
  UpcomingReservations,
  WelcomeHeader,
} from "@/features/home/components";
import type { Reservation } from "@/features/home/components/upcoming-reservations";
import { useHomeData } from "@/features/home/hooks/use-home-data";
import { appRoutes } from "@/shared/lib/app-routes";

export default function HomePage() {
  const router = useRouter();
  const { data: sessionUser, isLoading: sessionLoading } = useSession();
  const {
    profile,
    reservations: rawReservations,
    organization,
    isProfileComplete,
    isLoading: dataLoading,
  } = useHomeData();

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !sessionUser) {
      router.push(appRoutes.login.from(appRoutes.home.base));
    }
  }, [sessionUser, sessionLoading, router]);

  if (sessionLoading) {
    return null;
  }

  if (!sessionUser) return null;

  const now = new Date();
  const upcomingReservations = rawReservations
    .filter(
      (reservation) =>
        reservation.status !== "CANCELLED" && reservation.status !== "EXPIRED",
    )
    .filter((reservation) => {
      const endTime = reservation.slotEndTime
        ? new Date(reservation.slotEndTime)
        : reservation.createdAt
          ? new Date(reservation.createdAt)
          : null;
      return !endTime || endTime >= now;
    })
    .sort((a, b) => {
      const aStart = a.slotStartTime
        ? new Date(a.slotStartTime)
        : a.createdAt
          ? new Date(a.createdAt)
          : new Date(0);
      const bStart = b.slotStartTime
        ? new Date(b.slotStartTime)
        : b.createdAt
          ? new Date(b.createdAt)
          : new Date(0);
      return aStart.getTime() - bStart.getTime();
    })
    .slice(0, 3);

  // Transform reservations to match UI component
  const reservations: Reservation[] = upcomingReservations.map(
    (reservation) => {
      const startTime = reservation.slotStartTime
        ? new Date(reservation.slotStartTime)
        : reservation.createdAt
          ? new Date(reservation.createdAt)
          : new Date();

      return {
        id: reservation.id,
        startTime,
        status: reservation.status,
        court: {
          name: reservation.courtName || "Court",
          address: reservation.placeAddress || undefined,
        },
      };
    },
  );

  // Use mock data if no reservations found (for demo purposes if needed, otherwise just empty)
  // Per checklist, we might want to mock if endpoints aren't ready, but let's show empty state if truly empty

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <WelcomeHeader
        name={profile?.displayName || sessionUser.email?.split("@")[0]}
        isLoading={dataLoading}
      />

      <ProfileCompletionBanner isProfileComplete={isProfileComplete} />

      <QuickActions
        isAdmin={sessionUser.role === "admin"}
        isOwner={!!organization}
      />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <UpcomingReservations
            reservations={reservations}
            isLoading={dataLoading}
          />
        </div>
        <div>
          <OrganizationSection
            organization={organization}
            isLoading={dataLoading}
          />
        </div>
      </div>
    </div>
  );
}
