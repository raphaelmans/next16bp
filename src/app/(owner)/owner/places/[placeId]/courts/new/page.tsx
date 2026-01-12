"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useCourtForm, useOwnerOrganization } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

export default function NewPlaceCourtPage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const router = useRouter();
  const trpc = useTRPC();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: placeData, isLoading: placeLoading } = useQuery({
    ...trpc.placeManagement.getById.queryOptions({ placeId }),
    enabled: !!placeId,
  });

  const { data: sports = [], isLoading: sportsLoading } = useQuery(
    trpc.sport.list.queryOptions({}),
  );

  const { submit, isSubmitting } = useCourtForm({
    onSuccess: () => {
      toast.success("Court created successfully!");
      router.push(appRoutes.owner.places.courts.base(placeId));
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.new(placeId),
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.courts.base(placeId));
  };

  if (orgLoading || placeLoading || sportsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!placeData) {
    router.push(appRoutes.owner.places.base);
    return null;
  }

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
      <div className="space-y-6">
        <PageHeader
          title={`Add Court · ${placeData.place.name}`}
          description="Create a court for this place"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Add Court" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

        <CourtForm
          defaultValues={{ placeId }}
          placeOptions={placeOptions}
          sportOptions={sportOptions}
          onSubmit={submit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          disablePlaceSelect
        />
      </div>
    </AppShell>
  );
}
