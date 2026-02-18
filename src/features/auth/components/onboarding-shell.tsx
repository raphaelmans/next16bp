"use client";

import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { OnboardingShell as SharedOnboardingShell } from "@/components/layout/onboarding-shell";
import { useMutAuthLogout } from "@/features/auth/hooks";

interface AuthOnboardingShellProps {
  children: React.ReactNode;
  dashboardHref?: string;
}

export function AuthOnboardingShell({
  children,
  dashboardHref,
}: AuthOnboardingShellProps) {
  const router = useRouter();
  const { mutate: logout } = useMutAuthLogout();

  const handleSignOut = () => {
    logout(undefined, {
      onSuccess: () => {
        router.push(appRoutes.index.base);
      },
    });
  };

  return (
    <SharedOnboardingShell
      dashboardHref={dashboardHref}
      onSignOut={handleSignOut}
      homeHref={appRoutes.index.base}
    >
      {children}
    </SharedOnboardingShell>
  );
}
