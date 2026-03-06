"use client";

import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  PaymentMethodReminderCard,
  PlaceForm,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { PermissionGate } from "@/features/owner/components/permission-gate";
import {
  useModPlaceForm,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";

type OwnerPlaceNewPageProps = {
  fromSetup: boolean;
};

export default function OwnerPlaceNewPage({
  fromSetup,
}: OwnerPlaceNewPageProps) {
  const router = useRouter();
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const { submitAsync, isSubmitting } = useModPlaceForm({
    organizationId: organization?.id,
    onSuccess: (result) => {
      toast.success("Venue created successfully!");
      if (fromSetup) {
        router.push(appRoutes.organization.getStarted);
      } else {
        router.push(appRoutes.organization.places.courts.new(result.placeId));
      }
    },
  });

  const paymentMethodsQuery = useQueryOrganizationPaymentMethods(
    organization?.id,
  );
  const paymentMethods = paymentMethodsQuery.data?.methods ?? [];
  const showPaymentMethodReminder =
    !!organization?.id &&
    !paymentMethodsQuery.isLoading &&
    !paymentMethodsQuery.isError &&
    paymentMethods.length === 0;
  const paymentMethodsHref = `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.new,
    );
  };

  const handleCancel = () => {
    router.push(appRoutes.organization.places.base);
  };

  if (orgLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
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
                You need an organization before adding venues.
              </p>
              <Button asChild>
                <Link href={appRoutes.organization.getStarted}>
                  Get started
                </Link>
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
      <PermissionGate accessRule={{ type: "owner-only" }}>
        <div className="space-y-6">
          <PageHeader
            title="Create New Venue"
            description="Add a new venue for players to discover"
            breadcrumbs={[
              { label: "My Venues", href: appRoutes.organization.places.base },
              { label: "Create" },
            ]}
            backHref={appRoutes.organization.places.base}
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
      </PermissionGate>
    </AppShell>
  );
}
