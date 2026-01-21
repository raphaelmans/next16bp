"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  PlaceForm,
  PlacePhotoUpload,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { useOwnerOrganization, usePlaceForm } from "@/features/owner/hooks";
import type { PlaceFormData } from "@/features/owner/schemas/place-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

export default function EditPlacePage() {
  const params = useParams();
  const rawPlaceId = params.placeId;
  const placeId = Array.isArray(rawPlaceId) ? rawPlaceId[0] : rawPlaceId;
  const router = useRouter();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const isRouteReady = typeof placeId === "string" && placeId.length > 0;
  const resolvedPlaceId = (placeId ?? "") as string;
  const utils = trpc.useUtils();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  const { data: placeData, isLoading: placeLoading } =
    trpc.placeManagement.getById.useQuery(
      { placeId: resolvedPlaceId },
      { enabled: isRouteReady },
    );

  const { submitAsync, isSubmitting } = usePlaceForm({
    placeId,
    onSuccess: () => {
      toast.success("Venue updated successfully!");
    },
  });

  const deletePlaceMutation = trpc.placeManagement.delete.useMutation({
    onSuccess: async () => {
      if (organization?.id) {
        await utils.placeManagement.list.invalidate({
          organizationId: organization.id,
        });
      }
      await utils.placeManagement.invalidate();
      toast.success("Venue deleted successfully.");
      setDeleteDialogOpen(false);
      router.push(appRoutes.owner.places.base);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete venue.");
    },
  });

  const handleDeletePlace = async () => {
    if (!resolvedPlaceId) {
      return;
    }
    try {
      await deletePlaceMutation.mutateAsync({ placeId: resolvedPlaceId });
    } catch {
      return;
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    const redirectTo = isRouteReady
      ? appRoutes.owner.places.edit(resolvedPlaceId)
      : appRoutes.owner.places.base;
    window.location.href = appRoutes.login.from(redirectTo);
  };

  const handleCancel = () => {
    router.push(appRoutes.owner.places.base);
  };

  const shouldRedirect = isRouteReady && !placeLoading && !placeData;

  useEffect(() => {
    if (!shouldRedirect) {
      return;
    }
    void router.replace(appRoutes.owner.places.base);
  }, [router, shouldRedirect]);

  if (orgLoading || placeLoading || !isRouteReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  if (!placeData) {
    return null;
  }

  const place = placeData.place;
  const defaultValues: Partial<PlaceFormData> = {
    name: place.name,
    slug: place.slug ?? "",
    address: place.address,
    city: place.city,
    province: place.province ?? "",
    country: place.country ?? "PH",
    latitude: place.latitude ? Number.parseFloat(place.latitude) : undefined,
    longitude: place.longitude ? Number.parseFloat(place.longitude) : undefined,
    timeZone: place.timeZone,
    isActive: place.isActive,
    websiteUrl: placeData.contactDetail?.websiteUrl ?? "",
    facebookUrl: placeData.contactDetail?.facebookUrl ?? "",
    instagramUrl: placeData.contactDetail?.instagramUrl ?? "",
    phoneNumber: placeData.contactDetail?.phoneNumber ?? "",
    viberInfo: placeData.contactDetail?.viberInfo ?? "",
    otherContactInfo: placeData.contactDetail?.otherContactInfo ?? "",
  };
  const deleteConfirmationMatches = deleteConfirmValue.trim() === place.name;

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
          title={`Edit Venue: ${place.name}`}
          description="Update venue details and verification status"
          breadcrumbs={[
            { label: "My Venues", href: appRoutes.owner.places.base },
            { label: place.name },
            { label: "Edit" },
          ]}
          backHref={appRoutes.owner.places.base}
        />

        <PlaceForm
          defaultValues={defaultValues}
          onSubmit={submitAsync}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing
        />

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Venue verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Verify {place.name} to unlock reservations and build trust with
              players.
            </p>
            <Button asChild>
              <Link href={appRoutes.owner.verification.place(resolvedPlaceId)}>
                Go to verification
              </Link>
            </Button>
          </CardContent>
        </Card>

        <PlacePhotoUpload
          placeId={resolvedPlaceId}
          photos={(placeData.photos ?? []).map((photo) => ({
            id: photo.id,
            url: photo.url,
            displayOrder: photo.displayOrder,
          }))}
        />

        <Card className="border-destructive/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Deleting a venue removes its listing and detaches courts. Existing
              reservations remain for audit purposes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium">Delete venue</h4>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) {
                  setDeleteConfirmValue("");
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete venue</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {place.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the venue listing and detach courts. Stored
                    reservation history remains available for audit.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Type{" "}
                    <span className="font-semibold text-foreground">
                      {place.name}
                    </span>{" "}
                    to confirm.
                  </p>
                  <Input
                    value={deleteConfirmValue}
                    onChange={(event) =>
                      setDeleteConfirmValue(event.target.value)
                    }
                    placeholder={place.name}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletePlaceMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDeletePlace();
                    }}
                    disabled={
                      deletePlaceMutation.isPending ||
                      !deleteConfirmationMatches
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletePlaceMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Delete venue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
