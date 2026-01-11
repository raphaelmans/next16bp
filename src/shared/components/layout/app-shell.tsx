"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "./dashboard-layout";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  navbar: React.ReactNode;
  floatingPanel?: React.ReactNode;
  className?: string;
}

export function AppShell({
  children,
  sidebar,
  navbar,
  floatingPanel,
  className,
}: AppShellProps) {
  return (
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
        className={cn("w-full", className)}
      >
        <div id="main-content" className="w-full">
          {children}
        </div>
      </DashboardLayout>
      {floatingPanel}
    </div>
  );
}
