import { PublicShell as SharedPublicShell } from "@/components/layout/public-shell";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

interface DiscoveryPublicShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DiscoveryPublicShell({
  children,
  className,
}: DiscoveryPublicShellProps) {
  return (
    <SharedPublicShell
      className={className}
      navbar={<Navbar />}
      footer={<Footer />}
    >
      {children}
    </SharedPublicShell>
  );
}
