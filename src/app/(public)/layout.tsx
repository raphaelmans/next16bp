import { AppClientProviders } from "@/common/providers/app-client-providers";
import { DiscoveryPublicShell } from "@/features/discovery/components/public-shell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppClientProviders>
      <DiscoveryPublicShell>{children}</DiscoveryPublicShell>
    </AppClientProviders>
  );
}
