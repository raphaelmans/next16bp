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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {navbar}
        </header>
        {/* Main content */}
        <main className={cn("flex-1 overflow-auto p-4 md:p-6", className)}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
