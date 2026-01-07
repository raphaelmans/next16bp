"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { OwnerSidebar, OwnerNavbar } from "@/features/owner";
import { CourtForm } from "@/features/owner/components/court-form";
import {
  useCourtForm,
  useCourtDraft,
} from "@/features/owner/hooks/use-court-form";
import { useSession, useLogout } from "@/features/auth";
import { toast } from "sonner";

export default function NewCourtPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { submit, isSubmitting } = useCourtForm({
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

  // Mock organization data
  const mockOrg = { id: "1", name: "My Sports Complex" };

  return (
    <DashboardLayout
      sidebar={
        <OwnerSidebar
          currentOrganization={mockOrg}
          organizations={[mockOrg]}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={mockOrg.name}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Create New Court
          </h1>
          <p className="text-muted-foreground">
            Add a new court to your organization
          </p>
        </div>

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
