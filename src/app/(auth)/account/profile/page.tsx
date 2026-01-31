"use client";

import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { PageHeader } from "@/components/ui/page-header";
import { OwnerCtaSection } from "@/features/reservation/components/owner-cta-section";
import { ProfileForm } from "@/features/reservation/components/profile-form";
import { ProfileFormSkeleton } from "@/features/reservation/components/skeletons";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your profile and contact information"
        breadcrumbs={[
          { label: "Account", href: appRoutes.account.profile },
          { label: "Profile" },
        ]}
        backHref={appRoutes.home.base}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ProfileFormSkeleton />}>
            <ProfileForm />
          </Suspense>
        </div>
        <div>
          <OwnerCtaSection />
        </div>
      </div>
    </div>
  );
}
