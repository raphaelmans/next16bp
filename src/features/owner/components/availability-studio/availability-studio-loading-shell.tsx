"use client";

import { AppShell } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";

type AvailabilityStudioLoadingShellProps = {
  userName?: string;
  userEmail?: string;
  onLogout: () => Promise<void>;
};

export function AvailabilityStudioLoadingShell({
  userName,
  userEmail,
  onLogout,
}: AvailabilityStudioLoadingShellProps) {
  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={{ id: "", name: "Loading..." }}
          organizations={[]}
          user={{
            name: userName,
            email: userEmail,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName="Loading..."
          user={{
            name: userName,
            email: userEmail,
          }}
          onLogout={onLogout}
        />
      }
    >
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    </AppShell>
  );
}
