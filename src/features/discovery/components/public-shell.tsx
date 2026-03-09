import { PublicShell as SharedPublicShell } from "@/components/layout/public-shell";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { SearchNavigationProgressProvider } from "./search-navigation-progress-provider";

interface DiscoveryPublicShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DiscoveryPublicShell({
  children,
  className,
}: DiscoveryPublicShellProps) {
  return (
    <SearchNavigationProgressProvider>
      <SharedPublicShell
        className={className}
        navbar={<Navbar />}
        footer={<Footer />}
      >
        {children}
      </SharedPublicShell>
    </SearchNavigationProgressProvider>
  );
}
