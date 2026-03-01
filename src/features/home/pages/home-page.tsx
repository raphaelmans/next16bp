"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { appRoutes } from "@/common/app-routes";
import {
  useOwnerOnboardingIntent,
  useSetOwnerOnboardingIntent,
} from "@/common/hooks/owner-onboarding-intent";
import { useQueryAuthSession } from "@/features/auth/hooks";
import {
  OrganizationSection,
  ProfileCompletionBanner,
  QuickActions,
  UpcomingReservations,
  WelcomeHeader,
} from "@/features/home/components";
import type { Reservation } from "@/features/home/components/upcoming-reservations";
import { useQueryHomeData } from "@/features/home/hooks";

export default function HomePage() {
  const router = useRouter();
  const { data: sessionUser, isLoading: sessionLoading } =
    useQueryAuthSession();
  const { data: ownerOnboardingIntent } = useOwnerOnboardingIntent();
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();
  const {
    profile,
    reservations: rawReservations,
    organization,
    isProfileComplete,
    isLoading: dataLoading,
  } = useQueryHomeData();

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !sessionUser) {
      router.push(appRoutes.login.from(appRoutes.home.base));
    }
  }, [sessionUser, sessionLoading, router]);

  useEffect(() => {
    if (sessionLoading || dataLoading || !sessionUser) {
      return;
    }

    if (organization) {
      if (ownerOnboardingIntent) {
        setOwnerOnboardingIntent.mutate(false);
      }
      return;
    }

    if (ownerOnboardingIntent) {
      router.replace(appRoutes.organization.getStarted);
    }
  }, [
    dataLoading,
    organization,
    ownerOnboardingIntent,
    router,
    sessionLoading,
    sessionUser,
    setOwnerOnboardingIntent,
  ]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return rawReservations
      .filter(
        (reservation) =>
          reservation.status !== "CANCELLED" &&
          reservation.status !== "EXPIRED",
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
  }, [rawReservations]);

  // Transform reservations to match UI component
  const reservations: Reservation[] = useMemo(
    () =>
      upcomingReservations.map((reservation) => {
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
      }),
    [upcomingReservations],
  );

  if (sessionLoading) {
    return null;
  }

  if (!sessionUser) return null;

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

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
