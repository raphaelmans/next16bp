"use client";

import { ShieldCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  PlaceVerificationPanel,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { PermissionGate } from "@/features/owner/components/permission-gate";
import {
  useQueryOwnerOrganization,
  useQueryOwnerPlaceById,
} from "@/features/owner/hooks";

type OwnerVerificationPlacePageProps = {
  placeId: string;
  from?: string;
};

export default function OwnerVerificationPlacePage({
  placeId,
  from,
}: OwnerVerificationPlacePageProps) {
  const router = useRouter();
  const returnToHub =
    from === "setup" ? appRoutes.organization.getStarted : null;

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

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.verification.place(placeId),
    );
  };

  if (orgLoading || placeLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!placeData) {
    router.push(appRoutes.organization.places.base);
    return null;
  }

  const place = placeData.place;

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
      <PermissionGate accessRule={{ type: "owner-only" }}>
        <div className="space-y-6">
          <PageHeader
            title={`Verify ${place.name}`}
            description="Submit documents and enable reservations when approved."
            breadcrumbs={[
              { label: "My Venues", href: appRoutes.organization.places.base },
              {
                label: place.name,
                href: appRoutes.organization.places.edit(place.id),
              },
              { label: "Verification" },
            ]}
            backHref={appRoutes.organization.places.edit(place.id)}
            backLabel="Back to edit"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={appRoutes.organization.places.edit(place.id)}>
                    Edit venue
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={appRoutes.places.detail(place.slug ?? place.id)}>
                    View public page
                  </Link>
                </Button>
              </div>
            }
          />

          <Card className="border-dashed">
            <CardHeader className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Verification overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Verify {place.name} to unlock reservations and show players this
              venue is trusted.
            </CardContent>
          </Card>

          <PlaceVerificationPanel
            placeId={placeId}
            placeName={place.name}
            reservationCapable={place.placeType === "RESERVABLE"}
            returnTo={returnToHub ?? undefined}
          />
        </div>
      </PermissionGate>
    </AppShell>
  );
}
