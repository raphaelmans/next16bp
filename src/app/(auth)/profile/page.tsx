import { Suspense } from "react";
import { ProfileForm } from "@/features/reservation/components/profile-form";
import { ProfileFormSkeleton } from "@/features/reservation/components/skeletons";

export const metadata = {
  title: "Profile",
  description: "Manage your profile information",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and contact information
        </p>
      </div>

      {/* Profile form */}
      <Suspense fallback={<ProfileFormSkeleton />}>
        <ProfileForm />
      </Suspense>
    </div>
  );
}
