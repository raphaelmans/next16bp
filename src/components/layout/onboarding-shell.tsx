"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { KudosLogo } from "@/components/kudos";
import { Button } from "@/components/ui/button";

interface OnboardingShellProps {
  children: React.ReactNode;
  dashboardHref?: string;
  onSignOut?: () => void;
  homeHref?: string;
}

export function OnboardingShell({
  children,
  dashboardHref,
  onSignOut,
  homeHref = appRoutes.index.base,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center gap-2">
            <KudosLogo size={28} variant="full" />
          </Link>
          <div className="flex items-center gap-1">
            {dashboardHref ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={dashboardHref}>Go to dashboard</Link>
              </Button>
            ) : null}
            {onSignOut ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="text-muted-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
