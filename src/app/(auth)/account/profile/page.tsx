"use client";

import { Suspense } from "react";
import { ProfileForm } from "@/features/reservation/components/profile-form";
import { ProfileFormSkeleton } from "@/features/reservation/components/skeletons";
import { OwnerCtaSection } from "@/features/reservation/components/owner-cta-section";
import { PageHeader } from "@/components/ui/page-header";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your profile and contact information"
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Profile" },
        ]}
        backHref="/home"
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
