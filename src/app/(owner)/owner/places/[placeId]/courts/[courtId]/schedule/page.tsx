"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtScheduleEditor,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { useOwnerOrganization } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

export default function CourtSchedulePage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const courtId = params.courtId as string;
  const router = useRouter();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: placeData, isLoading: placeLoading } =
    trpc.placeManagement.getById.useQuery({ placeId }, { enabled: !!placeId });

  const { data: courtData, isLoading: courtLoading } =
    trpc.courtManagement.getById.useQuery({ courtId }, { enabled: !!courtId });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.schedule(placeId, courtId),
    );
  };

  if (orgLoading || courtLoading || placeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData || !placeData) {
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
          title={`Schedule & Pricing · ${courtData.court.label}`}
          description="Define open hours and pricing blocks for each day"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Schedule" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

        <CourtScheduleEditor
          courtId={courtId}
          organizationId={organization?.id ?? null}
          timeZone={placeData.place.timeZone}
          primaryActionLabel="Save schedule"
        />
      </div>
    </AppShell>
  );
}
