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
  className,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        {/* Top navbar */}
        <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {navbar}
        </header>
        {/* Main content */}
        <main
          className={cn(
            "flex-1 w-full overflow-auto px-4 py-6 sm:px-6 lg:px-8",
            className,
          )}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
