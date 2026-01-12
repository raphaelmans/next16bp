"use client";

import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import { useOwnerOrganization, useOwnerPlaces } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

export default function OwnerPlacesPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: places = [], isLoading: placesLoading } = useOwnerPlaces(
    organization?.id ?? null,
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.places.base);
  };

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">
              My Places
            </h1>
            <p className="text-muted-foreground">
              Manage your locations and courts
            </p>
          </div>
          <Button asChild>
            <Link href={appRoutes.owner.places.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Place
            </Link>
          </Button>
        </div>

        {placesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : places.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-heading font-semibold">No places yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first place to add courts and hours.
                </p>
              </div>
              <Button asChild>
                <Link href={appRoutes.owner.places.new}>Create a place</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {places.map((place) => (
              <Card key={place.id} className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h2 className="font-heading font-semibold text-lg">
                      {place.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {place.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {place.city} · {place.timeZone}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{place.courtCount} courts</span>
                    <span>•</span>
                    <span>
                      {place.sports.length > 0
                        ? place.sports.map((sport) => sport.name).join(", ")
                        : "No sports yet"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={appRoutes.owner.places.courts.base(place.id)}>
                        Manage Courts
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={appRoutes.owner.places.edit(place.id)}>
                        Edit Place
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={appRoutes.places.detail(place.id)}>
                        View Public Page
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
