"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { PlaceForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useOwnerOrganization, usePlaceForm } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

export default function NewPlacePage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { submit, isSubmitting } = usePlaceForm({
    organizationId: organization?.id,
    onSuccess: (result) => {
      toast.success("Place created successfully!");
      router.push(appRoutes.owner.places.courts.base(result.placeId));
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.places.new);
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.base);
  };

  if (orgLoading) {
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

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization}
          organizations={organizations}
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
          title="Create New Place"
          description="Add a new place for players to discover"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            { label: "Create" },
          ]}
          backHref={appRoutes.owner.places.base}
        />

        <PlaceForm
          onSubmit={submit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </AppShell>
  );
}
