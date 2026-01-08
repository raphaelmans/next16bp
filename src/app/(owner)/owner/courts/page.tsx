"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { OwnerSidebar, OwnerNavbar } from "@/features/owner";
import { CourtsTable } from "@/features/owner/components/courts-table";
import { CourtsEmptyState } from "@/features/owner/components/courts-empty-state";
import {
  useOwnerCourts,
  useDeactivateCourt,
} from "@/features/owner/hooks/use-owner-courts";
import { useOwnerOrganization } from "@/features/owner/hooks";
import { useSession, useLogout } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OwnerCourtsPage() {
  const { data: user } = useSession();
  const { data: courts, isLoading } = useOwnerCourts();
  const deactivateMutation = useDeactivateCourt();
  const logoutMutation = useLogout();

  // Use real organization from hook
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  const handleDeactivate = (courtId: string) => {
    deactivateMutation.mutate(
      { courtId },
      {
        onSuccess: () => {
          toast.success("Court deactivated successfully");
        },
        onError: () => {
          toast.error("Failed to deactivate court");
        },
      },
    );
  };

  // Show loading state while organization loads
  if (orgLoading) {
    return (
      <DashboardLayout
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
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
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
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              My Courts
            </h1>
            <p className="text-muted-foreground">
              Manage your courts and time slots
            </p>
          </div>
          <Button asChild>
            <Link href="/owner/courts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Court
            </Link>
          </Button>
        </div>

        {/* Courts list */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : courts && courts.length > 0 ? (
          <CourtsTable courts={courts} onDeactivate={handleDeactivate} />
        ) : (
          <CourtsEmptyState />
        )}
      </div>
    </DashboardLayout>
  );
}
