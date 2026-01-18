import { TRPCError } from "@trpc/server";
import { X } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createServerCaller } from "@/shared/infra/trpc/server";
import { appRoutes } from "@/shared/lib/app-routes";
import { OrganizationFormClient } from "./organization-form-client";

export const dynamic = "force-dynamic";

const checkOnboardingRedirect = async () => {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.owner.onboarding;
  const caller = await createServerCaller(pathname);

  try {
    const organizations = await caller.organization.my();
    if (organizations.length > 0) {
      redirect(appRoutes.owner.base);
    }
  } catch (error) {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect(appRoutes.login.from(pathname));
    }
    console.error("[owner-onboarding] Redirect check failed", error);
  }
};

export default async function OnboardingPage() {
  await checkOnboardingRedirect();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            Create your organization
          </h1>
          <p className="text-muted-foreground">
            Set up your organization profile to start listing courts.
          </p>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={appRoutes.home.base}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cancel</span>
          </Link>
        </Button>
      </div>

      <OrganizationFormClient />

      <p className="text-sm text-muted-foreground">
        By creating an organization, you agree to our{" "}
        <Link
          href={appRoutes.terms.base}
          className="underline hover:text-foreground"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href={appRoutes.privacy.base}
          className="underline hover:text-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
