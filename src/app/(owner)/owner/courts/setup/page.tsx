"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useCourtForm } from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas/court-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

export default function CreateCourtSetupPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: organizations, isLoading: orgsLoading } = useQuery(
    trpc.organization.my.queryOptions(),
  );

  const organization = organizations?.[0];

  const { data: places = [], isLoading: placesLoading } = useQuery({
    ...trpc.placeManagement.list.queryOptions({
      organizationId: organization?.id ?? "",
    }),
    enabled: !!organization?.id,
  });

  const { data: sports = [], isLoading: sportsLoading } = useQuery(
    trpc.sport.list.queryOptions({}),
  );

  const selectedPlaceIdRef = React.useRef<string>("");
  const [draft, setDraft] = React.useState<Partial<CourtFormData>>({});

  const { submit, isSubmitting } = useCourtForm({
    onSuccess: (result) => {
      toast.success("Court created successfully!");
      const targetPlaceId = selectedPlaceIdRef.current || draft.placeId || "";
      if (!targetPlaceId) {
        toast.error("Select a place to continue setup.");
        router.push(appRoutes.owner.courts.base);
        return;
      }
      router.push(
        `${appRoutes.owner.places.courts.setup(targetPlaceId, result.courtId)}?step=hours`,
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    router.push(appRoutes.owner.onboarding);
    return null;
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
          onSubmit={submit}
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
