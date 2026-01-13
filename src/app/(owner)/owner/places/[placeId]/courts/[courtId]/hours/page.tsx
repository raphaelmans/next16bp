"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtHoursEditor,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { useOwnerOrganization } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

export default function CourtHoursPage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const courtId = params.courtId as string;
  const router = useRouter();
  const trpc = useTRPC();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: courtData, isLoading: courtLoading } = useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.hours(placeId, courtId),
    );
  };

  if (orgLoading || courtLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData) {
    router.push(appRoutes.owner.places.courts.base(placeId));
    return null;
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
        <PageHeader
          title={`Court Hours · ${courtData.court.label}`}
          description="Set daily operating hours for bookings"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            {
              label: "Courts",
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Hours" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

        <CourtHoursEditor
          courtId={courtId}
          organizationId={organization?.id ?? null}
          primaryActionLabel="Save hours"
        />
      </div>
    </AppShell>
  );
}
