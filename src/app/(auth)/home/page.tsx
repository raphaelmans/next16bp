"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useHomeData } from "@/features/home/hooks/use-home-data";
import {
  WelcomeHeader,
  QuickActions,
  UpcomingReservations,
  OrganizationSection,
  ProfileCompletionBanner,
} from "@/features/home/components";
import type { Reservation } from "@/features/home/components/upcoming-reservations";

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
      router.push("/login");
    }
  }, [sessionUser, sessionLoading, router]);

  if (sessionLoading) {
    return null;
  }

  if (!sessionUser) return null;

  // Transform reservations to match UI component
  const reservations: Reservation[] = rawReservations.map((r: any) => ({
    id: r.id,
    startTime: r.startTime ? new Date(r.startTime) : new Date(), // Fallback
    status: r.status,
    court: r.court
      ? {
          name: r.court.name,
          address: r.court.address,
        }
      : { name: "Court details loading...", address: "" },
  }));

  // Use mock data if no reservations found (for demo purposes if needed, otherwise just empty)
  // Per checklist, we might want to mock if endpoints aren't ready, but let's show empty state if truly empty

  return (
    <div className="container py-8 space-y-8 mx-auto px-4">
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
