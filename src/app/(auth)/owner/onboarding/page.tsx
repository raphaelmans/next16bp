"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/use-auth";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { KudosLogo } from "@/shared/components/kudos";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

export default function OnboardingPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: sessionUser, isLoading: sessionLoading } = useSession();
  const { data: orgs, isLoading: orgsLoading } = useQuery({
    ...trpc.organization.my.queryOptions(),
    enabled: !!sessionUser,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !sessionUser) {
      router.push(appRoutes.login.from(appRoutes.owner.onboarding));
    }
  }, [sessionUser, sessionLoading, router]);

  // Redirect if user already has an org
  useEffect(() => {
    if (!orgsLoading && orgs && orgs.length > 0) {
      router.push(appRoutes.owner.base);
    }
  }, [orgs, orgsLoading, router]);

  const handleSuccess = () => {
    router.push(appRoutes.owner.base);
  };

  const handleCancel = () => {
    router.push(appRoutes.home.base);
  };

  if (sessionLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <KudosLogo size={48} variant="icon" />
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

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
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-5 w-5" />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>

      <OrganizationForm onSuccess={handleSuccess} onCancel={handleCancel} />

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
