"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtsEmptyState,
  CourtsTable,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useDeactivateCourt,
  useOwnerCourtsByPlace,
  useOwnerOrganization,
  useOwnerPlace,
} from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

export default function OwnerPlaceCourtsPage() {
  const params = useParams();
  const placeId = params.placeId as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const deactivateMutation = useDeactivateCourt();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: place, isLoading: placeLoading } = useOwnerPlace(placeId);
  const { data: courts = [], isLoading: courtsLoading } =
    useOwnerCourtsByPlace(placeId);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.base(placeId),
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

  if (orgLoading || placeLoading) {
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
              Courts at {place?.name ?? "Place"}
            </h1>
            <p className="text-muted-foreground">
              Manage courts, hours, and pricing rules
            </p>
          </div>
          <Button asChild>
            <Link href={appRoutes.owner.places.courts.setupCreate(placeId)}>
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
          <CourtsTable courts={courts} onDeactivate={handleDeactivate} />
        ) : (
          <CourtsEmptyState />
        )}
      </div>
    </AppShell>
  );
}
