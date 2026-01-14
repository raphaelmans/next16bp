"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useCourtForm, useOwnerOrganization } from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas/court-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

export default function EditPlaceCourtPage() {
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

  const { data: courtData, isLoading: courtLoading } =
    trpc.courtManagement.getById.useQuery({ courtId }, { enabled: !!courtId });

  const { data: placeData, isLoading: placeLoading } =
    trpc.placeManagement.getById.useQuery({ placeId }, { enabled: !!placeId });

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});

  const { submitAsync, isSubmitting } = useCourtForm({
    courtId,
    onSuccess: () => {
      toast.success("Court updated successfully!");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.edit(placeId, courtId),
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.courts.base(placeId));
  };

  if (orgLoading || courtLoading || placeLoading || sportsLoading) {
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

  const defaultValues: Partial<CourtFormData> = {
    placeId: courtData.court.placeId,
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
      <div className="space-y-6">
        <PageHeader
          title={`Edit Court · ${courtData.court.label}`}
          description="Update court details and pricing tier"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            {
              label: placeData.place.name,
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: courtData.court.label },
            { label: "Edit" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

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
      </div>
    </AppShell>
  );
}
