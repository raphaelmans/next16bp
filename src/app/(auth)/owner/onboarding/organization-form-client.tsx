"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { appRoutes } from "@/shared/lib/app-routes";
import { useSetOwnerOnboardingIntent } from "@/shared/lib/owner-onboarding-intent";
import { trpc } from "@/trpc/client";

const withCacheBust = (href: string) => {
  if (typeof window === "undefined") {
    return href;
  }

  const url = new URL(href, window.location.origin);
  url.searchParams.set("r", String(Date.now()));
  return `${url.pathname}${url.search}`;
};

export function OrganizationFormClient({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  const { data: organizations } = trpc.organization.my.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hasOrganization = (organizations?.length ?? 0) > 0;

  useEffect(() => {
    if (!hasOrganization) {
      return;
    }

    setOwnerOnboardingIntent.mutate(false);
    router.replace(withCacheBust(nextHref));
  }, [hasOrganization, nextHref, router, setOwnerOnboardingIntent]);

  return <OrganizationForm onCancel={() => router.push(appRoutes.home.base)} />;
}
