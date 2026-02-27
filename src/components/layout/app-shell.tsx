"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "./dashboard-layout";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  navbar: React.ReactNode;
  bottomNav?: React.ReactNode;
  floatingPanel?: React.ReactNode;
  className?: string;
}

const AppShellNestingContext = React.createContext(false);

export function AppShell({
  children,
  sidebar,
  navbar,
  bottomNav,
  floatingPanel,
  className,
}: AppShellProps) {
  const isNestedShell = React.useContext(AppShellNestingContext);

  if (isNestedShell) {
    return <>{children}</>;
  }

  return (
    <AppShellNestingContext.Provider value={true}>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 rounded-md bg-background px-3 py-2 text-sm font-heading font-semibold text-foreground shadow-md"
        >
          Skip to content
        </a>
        <DashboardLayout
          sidebar={sidebar}
          navbar={navbar}
          bottomNav={bottomNav}
          className={cn("w-full", className)}
        >
          <div id="main-content" className="min-w-0 w-full">
            {children}
          </div>
        </DashboardLayout>
        {floatingPanel}
      </div>
    </AppShellNestingContext.Provider>
  );
}
