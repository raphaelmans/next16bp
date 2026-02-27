"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import {
  useModCourtForm,
  useQueryOwnerOrganizations,
  useQueryOwnerPlacesByOrganization,
  useQueryOwnerSports,
} from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas";

export default function CreateCourtSetupPage() {
  const router = useRouter();
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();

  const { data: organizations, isLoading: orgsLoading } =
    useQueryOwnerOrganizations();

  const organization = organizations?.[0];

  const { data: places = [], isLoading: placesLoading } =
    useQueryOwnerPlacesByOrganization(
      { organizationId: organization?.id ?? "" },
      { enabled: !!organization?.id },
    );

  const { data: sports = [], isLoading: sportsLoading } = useQueryOwnerSports();

  const selectedPlaceIdRef = React.useRef<string>("");
  const [draft, setDraft] = React.useState<Partial<CourtFormData>>({});

  const { submitAsync, isSubmitting } = useModCourtForm({
    onSuccess: (result) => {
      toast.success("Court created successfully!");
      const targetPlaceId = selectedPlaceIdRef.current || draft.placeId || "";
      if (!targetPlaceId) {
        toast.error("Select a venue to continue setup.");
        router.push(appRoutes.owner.courts.base);
        return;
      }
      router.push(
        appRoutes.owner.places.courts.setup(
          targetPlaceId,
          result.courtId,
          "schedule",
        ),
      );
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.courts.setupCreate,
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.courts.base);
  };

  if (orgsLoading || placesLoading || sportsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "No Organization" }}
            organizations={organizations ?? []}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="No Organization"
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-xl">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-xl font-heading font-semibold">
                Create an organization first
              </h2>
              <p className="text-sm text-muted-foreground">
                You need an organization before creating courts.
              </p>
              <Button asChild>
                <Link href={appRoutes.owner.getStarted}>Get started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const placeOptions = places.map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
  }));

  const sportOptions = sports.map((sport) => ({
    id: sport.id,
    name: sport.name,
  }));

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization}
          organizations={organizations ?? []}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization.name}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization.id} />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Create Court"
          description="Add court details before setting hours and pricing"
          breadcrumbs={[
            { label: "My Courts", href: appRoutes.owner.courts.base },
            { label: "Create Court" },
          ]}
          backHref={appRoutes.owner.courts.base}
        />

        <CourtForm
          placeOptions={placeOptions}
          sportOptions={sportOptions}
          onSubmit={submitAsync}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          primaryActionLabel="Create & Continue"
          onStateChange={(data) => {
            setDraft(data);
            if (data.placeId) {
              selectedPlaceIdRef.current = data.placeId;
            }
          }}
        />
      </div>
    </AppShell>
  );
}
