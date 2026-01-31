import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { RegisterForm } from "@/features/auth";

export const metadata = {
  title: "Create Owner Account",
  description: "Create an owner account to list your venue on KudosCourts",
};

export default function RegisterOwnerPage() {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterForm
        title="Create Owner Account"
        description="Set up your owner account to list your venue, add courts, and accept bookings."
        defaultRedirect={appRoutes.owner.getStarted}
      />
    </Suspense>
  );
}

function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
