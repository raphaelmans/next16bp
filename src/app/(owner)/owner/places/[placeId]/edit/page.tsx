"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { PlaceForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useOwnerOrganization, usePlaceForm } from "@/features/owner/hooks";
import type { PlaceFormData } from "@/features/owner/schemas/place-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

export default function EditPlacePage() {
  const params = useParams();
  const placeId = params.placeId as string;
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

  const { submit, isSubmitting } = usePlaceForm({
    placeId,
    onSuccess: () => {
      toast.success("Place updated successfully!");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.edit(placeId),
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.base);
  };

  if (orgLoading || placeLoading) {
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

  const place = placeData.place;
  const defaultValues: Partial<PlaceFormData> = {
    name: place.name,
    address: place.address,
    city: place.city,
    latitude: place.latitude ? Number.parseFloat(place.latitude) : undefined,
    longitude: place.longitude ? Number.parseFloat(place.longitude) : undefined,
    timeZone: place.timeZone,
    isActive: place.isActive,
  };

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
          title={`Edit Place: ${place.name}`}
          description="Update place details and availability"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            { label: place.name },
            { label: "Edit" },
          ]}
          backHref={appRoutes.owner.places.base}
        />

        <PlaceForm
          defaultValues={defaultValues}
          onSubmit={submit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing
        />
      </div>
    </AppShell>
  );
}
