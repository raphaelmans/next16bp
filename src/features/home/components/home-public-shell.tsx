import { PublicShell } from "@/components/layout/public-shell";
import { Footer } from "@/features/discovery/components/footer";
import { HomeNavbar } from "./home-navbar";

export function HomePublicShell({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell navbar={<HomeNavbar />} footer={<Footer />}>
      {children}
    </PublicShell>
  );
}
