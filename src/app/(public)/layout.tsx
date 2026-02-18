import { DiscoveryPublicShell } from "@/features/discovery/components/public-shell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DiscoveryPublicShell>{children}</DiscoveryPublicShell>;
}
