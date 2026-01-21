"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { appRoutes } from "@/shared/lib/app-routes";
import { useSetOwnerOnboardingIntent } from "@/shared/lib/owner-onboarding-intent";
import { trpc } from "@/trpc/client";

export function OrganizationFormClient({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const didRedirectRef = useRef(false);
  const { mutate: setOwnerOnboardingIntent } = useSetOwnerOnboardingIntent();

  const { data: organizations } = trpc.organization.my.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hasOrganization = (organizations?.length ?? 0) > 0;

  useEffect(() => {
    if (!hasOrganization || didRedirectRef.current) {
      return;
    }

    didRedirectRef.current = true;
    setOwnerOnboardingIntent(false);
    router.replace(nextHref);
  }, [hasOrganization, nextHref, router, setOwnerOnboardingIntent]);

  return (
    <OrganizationForm
      onCancel={() => router.push(appRoutes.home.base)}
      onSuccess={() => {
        if (didRedirectRef.current) {
          return;
        }

        didRedirectRef.current = true;
        setOwnerOnboardingIntent(false);
        router.replace(nextHref);
      }}
    />
  );
}
