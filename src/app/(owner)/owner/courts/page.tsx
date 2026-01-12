"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtsEmptyState,
  CourtsTable,
  PlaceCourtFilter,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useOwnerCourtFilter,
  useOwnerOrganization,
  useOwnerPlaceFilter,
  useOwnerPlaces,
} from "@/features/owner/hooks";
import {
  useDeactivateCourt,
  useOwnerCourts,
} from "@/features/owner/hooks/use-owner-courts";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

export default function OwnerCourtsPage() {
  const { data: user } = useSession();
  const deactivateMutation = useDeactivateCourt();
  const logoutMutation = useLogout();

  // Use real organization from hook
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: places = [] } = useOwnerPlaces(organization?.id ?? null);
  const { placeId, setPlaceId } = useOwnerPlaceFilter();
  const { courtId, setCourtId } = useOwnerCourtFilter();

  const { data: courts, isLoading } = useOwnerCourts(organization?.id ?? null);

  const filteredCourts = React.useMemo(() => {
    const base = courts ?? [];
    const byPlace = placeId
      ? base.filter((court) => court.placeId === placeId)
      : base;
    return courtId ? byPlace.filter((court) => court.id === courtId) : byPlace;
  }, [courts, courtId, placeId]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.courts.base);
  };

  const handleDeactivate = (courtId: string) => {
    deactivateMutation.mutate(
      { courtId },
      {
        onSuccess: () => {
          toast.success("Court deactivated successfully");
        },
        onError: () => {
          toast.error("Failed to deactivate court");
        },
      },
    );
  };

  // Show loading state while organization loads
  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Courts
            </h1>
            <p className="text-muted-foreground">
              View courts across your places
            </p>
          </div>
          <Button asChild>
            <Link href={appRoutes.owner.courts.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Court
            </Link>
          </Button>
        </div>

        <PlaceCourtFilter
          places={places}
          courts={courts ?? []}
          placeId={placeId}
          courtId={courtId}
          onPlaceChange={(value) => setPlaceId(value === "all" ? "" : value)}
          onCourtChange={(value) => setCourtId(value === "all" ? "" : value)}
        />

        {/* Courts list */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredCourts.length > 0 ? (
          <CourtsTable
            courts={filteredCourts}
            onDeactivate={handleDeactivate}
          />
        ) : (
          <CourtsEmptyState />
        )}
      </div>
    </AppShell>
  );
}
