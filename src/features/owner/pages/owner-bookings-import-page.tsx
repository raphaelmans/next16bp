"use client";

import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { BookingsImportUploadForm } from "@/features/owner/components/bookings-import/bookings-import-upload-form";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";

export default function OwnerBookingsImportPage() {
  const router = useRouter();
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const [fromParam] = useQueryState("from", parseAsString);
  const isFromSetup = fromParam === "setup";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.base);
  };

  const handleDraftCreated = (jobId: string) => {
    const reviewHref = isFromSetup
      ? `${appRoutes.owner.imports.bookingsReview(jobId)}?from=setup`
      : appRoutes.owner.imports.bookingsReview(jobId);
    router.push(reviewHref);
  };

  const handleCancel = () => {
    router.push(
      isFromSetup
        ? appRoutes.owner.getStarted
        : appRoutes.owner.imports.bookings,
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
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
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
    >
      <div className="space-y-6">
        <PageHeader
          title="Import Existing Bookings"
          description="Bring in external reservations to prevent double-booking."
          breadcrumbs={[
            { label: "Owner", href: appRoutes.owner.base },
            { label: "Imports", href: appRoutes.owner.imports.bookings },
            { label: "Bookings" },
          ]}
        />

        {organization ? (
          <BookingsImportUploadForm
            organizationId={organization.id}
            onDraftCreated={handleDraftCreated}
            onCancel={handleCancel}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
