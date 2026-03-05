"use client";

import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtAddonEditor,
  CourtPageNav,
  CourtScheduleEditor,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useQueryOwnerCourtById,
  useQueryOwnerOrganization,
  useQueryOwnerPlaceById,
} from "@/features/owner/hooks";

type OwnerPlaceCourtSchedulePageProps = {
  placeId: string;
  courtId: string;
  fromSetup: boolean;
};

export default function CourtSchedulePage({
  placeId,
  courtId,
  fromSetup,
}: OwnerPlaceCourtSchedulePageProps) {
  const router = useRouter();
  const isFromSetup = fromSetup;

  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const { data: placeData, isLoading: placeLoading } = useQueryOwnerPlaceById(
    { placeId },
    { enabled: !!placeId },
  );

  const { data: courtData, isLoading: courtLoading } = useQueryOwnerCourtById(
    { courtId },
    { enabled: !!courtId },
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.courts.schedule(placeId, courtId),
    );
  };

  if (orgLoading || courtLoading || placeLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!courtData || !placeData) {
    router.push(appRoutes.organization.places.courts.base(placeId));
    return null;
  }

  return (
    <AppShell
      className="overflow-x-visible"
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
          title={courtData.court.label}
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.organization.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.organization.places.courts.base(placeId),
            },
            { label: courtData.court.label },
          ]}
          backHref={appRoutes.organization.places.courts.base(placeId)}
        />

        <CourtPageNav placeId={placeId} courtId={courtId} />

        <CourtScheduleEditor
          courtId={courtId}
          organizationId={organization?.id ?? null}
          primaryActionLabel="Save schedule"
          onSaved={() => {
            if (isFromSetup) {
              router.push(appRoutes.organization.getStarted);
            }
          }}
        />

        <CourtAddonEditor
          courtId={courtId}
          placeId={placeId}
          organizationId={organization?.id}
        />
      </div>
    </AppShell>
  );
}
