"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  CourtForm,
  CourtPageNav,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { PermissionGate } from "@/features/owner/components/permission-gate";
import {
  useModCourtForm,
  useQueryOwnerCourtById,
  useQueryOwnerOrganization,
  useQueryOwnerPlaceById,
  useQueryOwnerSports,
} from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas";

type OwnerPlaceCourtEditPageProps = {
  placeId: string;
  courtId: string;
};

export default function EditPlaceCourtPage({
  placeId,
  courtId,
}: OwnerPlaceCourtEditPageProps) {
  const router = useRouter();

  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const { data: courtData, isLoading: courtLoading } = useQueryOwnerCourtById(
    { courtId },
    { enabled: !!courtId },
  );

  const { data: placeData, isLoading: placeLoading } = useQueryOwnerPlaceById(
    { placeId },
    { enabled: !!placeId },
  );

  const { data: sports = [], isLoading: sportsLoading } = useQueryOwnerSports();

  const { submitAsync, isSubmitting } = useModCourtForm({
    courtId,
    onSuccess: () => {
      toast.success("Venue updated successfully!");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.courts.edit(placeId, courtId),
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.organization.places.courts.base(placeId));
  };

  if (orgLoading || courtLoading || placeLoading || sportsLoading) {
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

  const defaultValues: Partial<CourtFormData> = {
    placeId: courtData.court.placeId ?? placeId,
    sportId: courtData.sport.id,
    label: courtData.court.label,
    tierLabel: courtData.court.tierLabel,
    isActive: courtData.court.isActive,
  };

  const placeOptions = [
    {
      id: placeData.place.id,
      name: placeData.place.name,
      city: placeData.place.city,
    },
  ];

  const sportOptions = sports.map((sport) => ({
    id: sport.id,
    name: sport.name,
  }));

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
      <PermissionGate
        accessRule={{ type: "permission", permission: "place.manage" }}
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

          <CourtForm
            defaultValues={defaultValues}
            placeOptions={placeOptions}
            sportOptions={sportOptions}
            onSubmit={submitAsync}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing
            disablePlaceSelect
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Venue photos are not configurable yet. You can manage venue
                photos in the venue settings.
              </p>
              <Button asChild variant="outline">
                <Link
                  href={`${appRoutes.organization.places.edit(placeId)}#venue-photos`}
                >
                  Manage venue photos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PermissionGate>
    </AppShell>
  );
}
