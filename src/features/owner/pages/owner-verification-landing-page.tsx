"use client";

import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import {
  useQueryOwnerOrganization,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";

export default function OwnerVerificationLandingPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const { data: places = [], isLoading: placesLoading } = useQueryOwnerPlaces(
    organization?.id ?? null,
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.verify);
  };

  if (orgLoading || placesLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
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
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Venue Verification
          </h1>
          <p className="text-muted-foreground">
            Submit verification documents for each venue to unlock bookings.
          </p>
        </div>

        {places.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>No venues yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create your first venue to submit verification documents.
              <div className="mt-4">
                <Link
                  href={appRoutes.owner.places.new}
                  className="text-primary hover:underline"
                >
                  Create a venue
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {places.map((place) => (
              <Card key={place.id} className="border shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{place.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {place.city}
                      </p>
                    </div>
                    <Badge
                      variant={
                        place.verificationStatus === "VERIFIED"
                          ? "success"
                          : place.verificationStatus === "PENDING"
                            ? "warning"
                            : place.verificationStatus === "REJECTED"
                              ? "destructive"
                              : "secondary"
                      }
                      className="gap-1"
                    >
                      {place.verificationStatus === "VERIFIED" && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {place.verificationStatus === "PENDING" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {place.verificationStatus === "REJECTED" && (
                        <XCircle className="h-3 w-3" />
                      )}
                      {place.verificationStatus ?? "UNVERIFIED"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {place.address}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={appRoutes.owner.verification.place(place.id)}>
                        Go to verification
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={appRoutes.owner.places.edit(place.id)}>
                        Edit venue
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={appRoutes.places.detail(place.slug ?? place.id)}
                      >
                        View public page
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
