"use client";

import { AppShell } from "./app-shell";

interface PlayerShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  navbar: React.ReactNode;
  bottomNav?: React.ReactNode;
  floatingPanel?: React.ReactNode;
}

export function PlayerShell({
  children,
  sidebar,
  navbar,
  bottomNav,
  floatingPanel,
}: PlayerShellProps) {
  return (
    <AppShell
      sidebar={sidebar}
      navbar={navbar}
      bottomNav={bottomNav}
      floatingPanel={floatingPanel}
    >
      {children}
    </AppShell>
  );
}
