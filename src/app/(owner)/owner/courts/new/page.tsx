"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { CourtForm } from "@/features/owner/components/court-form";
import {
  useCourtDraft,
  useCourtForm,
} from "@/features/owner/hooks/use-court-form";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { useTRPC } from "@/trpc/client";

export default function NewCourtPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  // Fetch the user's organizations
  const { data: organizations, isLoading: orgsLoading } = useQuery(
    trpc.organization.my.queryOptions(),
  );

  // Get the first organization (owner layout guard ensures they have one)
  const organization = organizations?.[0];

  const { submit, isSubmitting } = useCourtForm({
    organizationId: organization?.id ?? "",
    onSuccess: (result) => {
      toast.success("Court created successfully!");
      // Redirect to slots page for the newly created court
      router.push(`/owner/courts/${result.courtId}/slots`);
    },
  });

  const draftMutation = useCourtDraft();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  const handleSaveDraft = (
    data: Parameters<typeof draftMutation.mutate>[0],
  ) => {
    draftMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Draft saved!");
      },
    });
  };

  const handleCancel = () => {
    router.push("/owner/courts");
  };

  // Show loading state while fetching organization
  if (orgsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // This shouldn't happen due to layout guard, but handle gracefully
  if (!organization) {
    router.push("/owner/onboarding");
    return null;
  }

  return (
    <DashboardLayout
      sidebar={
        <OwnerSidebar
          currentOrganization={organization}
          organizations={organizations ?? []}
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
    >
      <div className="space-y-6">
        <PageHeader
          title="Create New Court"
          description="Add a new court to your organization"
          breadcrumbs={[
            { label: "My Courts", href: "/owner/courts" },
            { label: "Create" },
          ]}
          backHref="/owner/courts"
        />

        {/* Form */}
        <CourtForm
          onSubmit={submit}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}
