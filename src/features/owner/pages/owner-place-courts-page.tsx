"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtsEmptyState,
  CourtsTable,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useMutDeactivateCourt,
  useQueryOwnerCourtsByPlace,
  useQueryOwnerOrganization,
  useQueryOwnerPlace,
} from "@/features/owner/hooks";

type OwnerPlaceCourtsPageProps = {
  placeId: string;
  isFromSetup: boolean;
};

export default function OwnerPlaceCourtsPage({
  placeId,
  isFromSetup,
}: OwnerPlaceCourtsPageProps) {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const deactivateMutation = useMutDeactivateCourt();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const { data: place, isLoading: placeLoading } = useQueryOwnerPlace(placeId);
  const { data: courts = [], isLoading: courtsLoading } =
    useQueryOwnerCourtsByPlace(placeId);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.courts.base(placeId),
    );
  };

  const handleDeactivate = (courtId: string) => {
    deactivateMutation.mutate(
      { courtId },
      {
        onSuccess: () => toast.success("Court deactivated successfully"),
        onError: () => toast.error("Failed to deactivate court"),
      },
    );
  };

  const addCourtHref = isFromSetup
    ? `${appRoutes.organization.places.courts.setupCreate(placeId)}?from=setup`
    : appRoutes.organization.places.courts.setupCreate(placeId);

  if (orgLoading || placeLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "" }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName=""
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
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-12 w-full" />
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Courts at {place?.name ?? "Venue"}
            </h1>
            <p className="text-muted-foreground">
              Manage courts, hours, and pricing rules
            </p>
          </div>
          <Button asChild>
            <Link href={addCourtHref}>
              <Plus className="mr-2 h-4 w-4" />
              Add Court
            </Link>
          </Button>
        </div>

        {courtsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : courts.length > 0 ? (
          <CourtsTable
            courts={courts}
            onDeactivate={handleDeactivate}
            fromSetup={isFromSetup}
          />
        ) : (
          <CourtsEmptyState />
        )}
      </div>
    </AppShell>
  );
}
