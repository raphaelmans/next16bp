"use client";

import { Providers } from "@/common/providers";
import { PwaInstallPrompt } from "@/features/pwa/components/pwa-install-prompt";
import { SwRegister } from "@/features/pwa/components/sw-register";

export function AppClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Providers>{children}</Providers>
      <SwRegister />
      <PwaInstallPrompt />
    </>
  );
}
