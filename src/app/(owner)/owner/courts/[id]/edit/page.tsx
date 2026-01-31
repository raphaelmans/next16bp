"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useCourtForm } from "@/features/owner/hooks";
import type { CourtFormData } from "@/features/owner/schemas";
import { trpc } from "@/trpc/client";

export default function EditCourtPage() {
  const params = useParams();
  const courtId = params.id as string;
  const router = useRouter();

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: organizations, isLoading: orgsLoading } =
    trpc.organization.my.useQuery();

  const organization = organizations?.[0];

  const { data: courtData, isLoading: courtLoading } =
    trpc.courtManagement.getById.useQuery({ courtId }, { enabled: !!courtId });

  const { data: places = [], isLoading: placesLoading } =
    trpc.placeManagement.list.useQuery(
      { organizationId: organization?.id ?? "" },
      { enabled: !!organization?.id },
    );

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
      appRoutes.owner.courts.edit(courtId),
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.courts.base);
  };

  if (orgsLoading || courtLoading || placesLoading || sportsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData) {
    router.push(appRoutes.owner.courts.base);
    return null;
  }

  const defaultValues: Partial<CourtFormData> = {
    placeId: courtData.court.placeId ?? undefined,
    sportId: courtData.sport.id,
    label: courtData.court.label,
    tierLabel: courtData.court.tierLabel,
    isActive: courtData.court.isActive,
  };

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
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations ?? []}
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
          title={`Edit Court: ${courtData.court.label}`}
          description="Update court details and sport assignments"
          breadcrumbs={[
            { label: "My Courts", href: appRoutes.owner.courts.base },
            { label: courtData.court.label },
            { label: "Edit" },
          ]}
          backHref={appRoutes.owner.courts.base}
        />

        <CourtForm
          defaultValues={defaultValues}
          placeOptions={placeOptions}
          sportOptions={sportOptions}
          onSubmit={submitAsync}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing
        />
      </div>
    </AppShell>
  );
}
