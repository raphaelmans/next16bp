"use client";

import type * as React from "react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  navbar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

/**
 * Dashboard layout component with sidebar and main content area.
 * Provides responsive sidebar (sheet on mobile, fixed on desktop).
 */
export function DashboardLayout({
  children,
  sidebar,
  navbar,
  bottomNav,
  className,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider className="!h-dvh">
      {sidebar}
      <SidebarInset>
        {/* Top navbar */}
        <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator
            orientation="vertical"
            className="mr-2 hidden h-4 md:block"
          />
          {navbar}
        </header>
        {/* Main content */}
        <main
          className={cn(
            "flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 lg:px-8",
            bottomNav &&
              "pb-[calc(3.5rem+max(0px,env(safe-area-inset-bottom)))] md:pb-6",
            className,
          )}
        >
          {children}
        </main>
        {bottomNav}
      </SidebarInset>
    </SidebarProvider>
  );
}
