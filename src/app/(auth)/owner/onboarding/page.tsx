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

const checkOnboardingRedirect = async (nextHref: string) => {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.owner.onboarding;
  const caller = await createServerCaller(pathname);

  const organizations = await caller.organization.my().catch((error) => {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect(appRoutes.login.from(pathname));
    }

    console.error("[owner-onboarding] Redirect check failed", error);
    return null;
  });

  if ((organizations?.length ?? 0) > 0) {
    redirect(nextHref);
  }
};

const getSafeNextHref = (nextHref: string | undefined) => {
  if (!nextHref) {
    return appRoutes.owner.places.new;
  }

  if (!nextHref.startsWith("/") || nextHref.startsWith("//")) {
    return appRoutes.owner.places.new;
  }

  if (nextHref === appRoutes.owner.onboarding) {
    return appRoutes.owner.places.new;
  }

  const ownerBase = appRoutes.owner.base;
  const isOwnerPath =
    nextHref === ownerBase || nextHref.startsWith(`${ownerBase}/`);
  if (!isOwnerPath) {
    return appRoutes.owner.places.new;
  }

  return nextHref;
};

type OnboardingPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next[0]
    : searchParams?.next;
  const nextHref = getSafeNextHref(nextParam);

  await checkOnboardingRedirect(nextHref);

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

      <OrganizationFormClient nextHref={nextHref} />

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
