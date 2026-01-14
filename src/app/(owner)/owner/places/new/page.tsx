"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  PaymentMethodReminderCard,
  PlaceForm,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useOrganizationPaymentMethods,
  useOwnerOrganization,
  usePlaceForm,
} from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/shared/lib/section-hashes";

export default function NewPlacePage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { submitAsync, isSubmitting } = usePlaceForm({
    organizationId: organization?.id,
    onSuccess: (result) => {
      toast.success("Place created successfully!");
      router.push(appRoutes.owner.places.courts.base(result.placeId));
    },
  });

  const paymentMethodsQuery = useOrganizationPaymentMethods(organization?.id);
  const paymentMethods = paymentMethodsQuery.data?.methods ?? [];
  const showPaymentMethodReminder =
    !!organization?.id &&
    !paymentMethodsQuery.isLoading &&
    !paymentMethodsQuery.isError &&
    paymentMethods.length === 0;
  const paymentMethodsHref = `${appRoutes.owner.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`;

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
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "No Organization" }}
            organizations={organizations}
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
                You need an organization before adding places.
              </p>
              <Button asChild>
                <Link href={appRoutes.owner.onboarding}>Go to onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
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

        {showPaymentMethodReminder && (
          <PaymentMethodReminderCard
            title="Payment methods missing"
            description="Add at least one payment method so players can complete payments once reservations are accepted."
            actionLabel="Add payment method"
            actionHref={paymentMethodsHref}
          />
        )}

        <PlaceForm
          onSubmit={submitAsync}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </AppShell>
  );
}
