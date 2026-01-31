"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm, ReservationAlertsPanel } from "@/features/owner/components";
import { useCourtForm, useOwnerOrganization } from "@/features/owner/hooks";
import { trpc } from "@/trpc/client";

export default function NewPlaceCourtPage() {
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

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});

  const { submitAsync, isSubmitting } = useCourtForm({
    onSuccess: () => {
      toast.success("Court created successfully!");
      router.push(appRoutes.owner.verification.place(placeId));
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

  const isLoading = orgLoading || placeLoading || sportsLoading;

  if (isLoading) {
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
                You need an organization before creating courts.
              </p>
              <Button asChild>
                <Link
                  href={`${appRoutes.owner.getStarted}?next=${encodeURIComponent(
                    appRoutes.owner.places.courts.new(placeId),
                  )}`}
                >
                  Get started
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!placeData) {
    router.push(appRoutes.owner.places.base);
    return null;
  }

  const place = placeData.place;

  const placeOptions = [
    {
      id: place.id,
      name: place.name,
      city: place.city,
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
          title="Step 2 of 3 · Add a Court"
          description="Create at least one court for this venue. Next: verification."
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            { label: place.name, href: appRoutes.owner.places.edit(place.id) },
            { label: "Add court" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
          backLabel="Back to courts"
        />

        <CourtForm
          defaultValues={{ placeId }}
          placeOptions={placeOptions}
          sportOptions={sportOptions}
          onSubmit={submitAsync}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          disablePlaceSelect
          primaryActionLabel="Create Court & Continue"
        />
      </div>
    </AppShell>
  );
}
