"use client";

import { MapPinPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { appRoutes } from "@/common/app-routes";
import {
  useOwnerOnboardingIntent,
  useSetOwnerOnboardingIntent,
} from "@/common/hooks/owner-onboarding-intent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryAuthSession } from "@/features/auth/hooks";
import {
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
            name: reservation.courtName || "Venue",
            address: reservation.placeAddress || undefined,
          },
        };
      }),
    [upcomingReservations],
  );

  if (sessionLoading || !sessionUser) {
    return (
      <div className="space-y-6">
        <WelcomeHeader isLoading />
        <QuickActions isAdmin={false} isOwner={false} />
        <UpcomingReservations reservations={[]} isLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeHeader
        name={profile?.displayName || sessionUser.email?.split("@")[0]}
        isLoading={dataLoading}
      />

      <ProfileCompletionBanner isProfileComplete={isProfileComplete} />

      <QuickActions
        isAdmin={sessionUser.role === "admin"}
        isOwner={!!organization}
      />

      <UpcomingReservations
        reservations={reservations}
        isLoading={dataLoading}
      />

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPinPlus className="size-5 text-primary" />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-medium">Know a venue that's missing?</p>
            <p className="text-xs text-muted-foreground">
              Help the community by adding courts and clubs you play at.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={appRoutes.submitVenue.base}>Submit a venue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
