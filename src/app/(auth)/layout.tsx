"use client";

import { usePathname } from "next/navigation";
import { PlayerShell, PublicShell } from "@/shared/components/layout";

const AUTH_ROUTES = ["/login", "/register", "/magic-link"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  const isPublicDiscovery = pathname.startsWith("/courts");

  if (isAuthRoute) {
    return (
      <PublicShell>
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-12">
          {children}
        </div>
      </PublicShell>
    );
  }

  if (isPublicDiscovery) {
    return <PublicShell>{children}</PublicShell>;
  }

  return <PlayerShell>{children}</PlayerShell>;
}
