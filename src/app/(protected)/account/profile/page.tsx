import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { ProfileForm } from "@/features/profile";

export const metadata = {
  title: "Profile",
  description: "Manage your profile details",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Update your account details and contact information.
        </p>
        <Link
          href={appRoutes.dashboard.base}
          className="text-primary text-sm hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <ProfileForm />
    </div>
  );
}
