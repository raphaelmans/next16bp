"use client";

import {
  Clock,
  Image as ImageIcon,
  Loader2,
  Plus,
  Settings2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useRef } from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  ReservationAlertsPanel,
  VenueQrCodeDialog,
} from "@/features/owner/components";
import {
  useMutUploadOrganizationLogo,
  useQueryOwnerOrganization,
  useQueryOwnerOrganizationDetails,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";

export default function OwnerPlacesPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const organizationDetailsQuery = useQueryOwnerOrganizationDetails(
    { id: organization?.id ?? "" },
    { enabled: !!organization?.id },
  );
  const uploadLogo = useMutUploadOrganizationLogo(organization?.id ?? "");
  const { data: places = [], isLoading: placesLoading } = useQueryOwnerPlaces(
    organization?.id ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.places.base,
    );
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

  const verificationCounts = places.reduce(
    (acc, place) => {
      const status = place.verificationStatus ?? "UNVERIFIED";
      acc.total += 1;
      acc[status] += 1;
      return acc;
    },
    {
      total: 0,
      UNVERIFIED: 0,
      PENDING: 0,
      VERIFIED: 0,
      REJECTED: 0,
    },
  );

  const logoUrl = organizationDetailsQuery.data?.profile?.logoUrl ?? undefined;
  const organizationName = organization?.name ?? "";
  const logoFallback = organizationName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isUploadingLogo = uploadLogo.isPending;

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!organization?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const acceptedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/jpg",
    ];

    if (!acceptedTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, or WebP file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("organizationId", organization.id);
    formData.append("image", file, file.name);

    try {
      await uploadLogo.mutateAsync(formData);
    } catch {
      // errors handled in hook
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">
              My Venues
            </h1>
            <p className="text-muted-foreground">
              Manage your locations and courts
            </p>
          </div>
          <Button asChild>
            <Link href={appRoutes.organization.places.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Venue
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Shown on all your venues and public pages.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {logoUrl ? "Change logo" : "Upload logo"}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16">
              {logoUrl ? (
                <AvatarImage src={logoUrl} alt={organizationName} />
              ) : null}
              <AvatarFallback className="text-base font-semibold">
                {logoFallback || "KC"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {organizationName || "Your organization"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or WebP. Max 5MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={isUploadingLogo}
            />
          </CardContent>
        </Card>

        {(verificationCounts.PENDING > 0 ||
          verificationCounts.REJECTED > 0 ||
          verificationCounts.UNVERIFIED > 0) && (
          <Card className="border-dashed">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">Verification status</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {verificationCounts.PENDING > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {verificationCounts.PENDING} pending
                    </Badge>
                  )}
                  {verificationCounts.REJECTED > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {verificationCounts.REJECTED} rejected
                    </Badge>
                  )}
                  {verificationCounts.UNVERIFIED > 0 && (
                    <Badge variant="outline" className="gap-1">
                      {verificationCounts.UNVERIFIED} unverified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="font-heading font-semibold">No venues yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first venue to add courts and hours.
                </p>
              </div>
              <Button asChild>
                <Link href={appRoutes.organization.places.new}>
                  Create a venue
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {places.map((place) => (
              <Card key={place.id} className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading font-semibold text-lg">
                        {place.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {place.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {place.city}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
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
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {place.verificationStatus === "PENDING" && (
                          <Clock className="h-3 w-3" />
                        )}
                        {place.verificationStatus === "REJECTED" && (
                          <XCircle className="h-3 w-3" />
                        )}
                        {place.verificationStatus === "UNVERIFIED" && (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {place.verificationStatus ?? "UNVERIFIED"}
                      </Badge>
                      {place.verificationStatus === "VERIFIED" && (
                        <Badge
                          variant={
                            place.reservationsEnabled ? "success" : "secondary"
                          }
                          className="gap-1"
                        >
                          {place.reservationsEnabled
                            ? "Reservations on"
                            : "Reservations off"}
                        </Badge>
                      )}
                    </div>
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
                      <Link
                        href={appRoutes.organization.places.courts.base(
                          place.id,
                        )}
                      >
                        Manage Courts
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={appRoutes.organization.places.edit(place.id)}>
                        Edit Venue
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={appRoutes.organization.verification.place(
                          place.id,
                        )}
                      >
                        Verification
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={appRoutes.places.detail(place.slug ?? place.id)}
                      >
                        View Public Page
                      </Link>
                    </Button>

                    <VenueQrCodeDialog
                      venueName={place.name}
                      venueSlugOrId={place.slug ?? place.id}
                    />
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
