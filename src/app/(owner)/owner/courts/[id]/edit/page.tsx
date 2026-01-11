"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm } from "@/features/owner/components/court-form";
import { useCourtForm } from "@/features/owner/hooks/use-court-form";
import type { CourtFormData } from "@/features/owner/schemas/court-form.schema";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

interface ReservableDetail {
  isFree: boolean;
  defaultCurrency?: string | null;
  defaultPriceCents?: number | null;
  paymentInstructions?: string | null;
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

export default function EditCourtPage() {
  const params = useParams();
  const courtId = params.id as string;
  const router = useRouter();
  const trpc = useTRPC();

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: organizations, isLoading: orgsLoading } = useQuery(
    trpc.organization.my.queryOptions(),
  );

  const { data: courtData, isLoading: courtLoading } = useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
  });

  const organization = organizations?.[0];

  const { submit, isSubmitting } = useCourtForm({
    organizationId: organization?.id ?? "",
    courtId,
    initialAmenities: courtData?.amenities,
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

  if (orgsLoading || courtLoading) {
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

  const detail =
    courtData.court.courtType === "RESERVABLE"
      ? (courtData.detail as ReservableDetail | null)
      : null;

  const defaultValues: Partial<CourtFormData> = {
    name: courtData.court.name,
    address: courtData.court.address,
    city: courtData.court.city,
    latitude: courtData.court.latitude
      ? parseFloat(courtData.court.latitude)
      : undefined,
    longitude: courtData.court.longitude
      ? parseFloat(courtData.court.longitude)
      : undefined,
    photos: courtData.photos?.map((photo) => photo.url) ?? [],
    amenities: courtData.amenities?.map((amenity) => amenity.name) ?? [],
    isFree: detail?.isFree ?? false,
    defaultHourlyRate:
      detail?.defaultPriceCents && detail.defaultPriceCents > 0
        ? detail.defaultPriceCents / 100
        : undefined,
    currency: detail?.defaultCurrency ?? "PHP",
    paymentInstructions: detail?.paymentInstructions ?? "",
    gcashEnabled: !!detail?.gcashNumber,
    gcashNumber: detail?.gcashNumber ?? "",
    bankTransferEnabled:
      !!detail?.bankName ||
      !!detail?.bankAccountNumber ||
      !!detail?.bankAccountName,
    bankName: detail?.bankName ?? "",
    bankAccountNumber: detail?.bankAccountNumber ?? "",
    bankAccountName: detail?.bankAccountName ?? "",
  };

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
    >
      <div className="space-y-6">
        <PageHeader
          title={`Edit Court: ${courtData.court.name}`}
          description="Update your court details and pricing"
          breadcrumbs={[
            { label: "My Courts", href: appRoutes.owner.courts.base },
            { label: courtData.court.name },
            { label: "Edit" },
          ]}
          backHref={appRoutes.owner.courts.base}
        />

        <CourtForm
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
