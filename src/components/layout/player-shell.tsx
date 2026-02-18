"use client";

import { AppShell } from "./app-shell";

interface PlayerShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  navbar: React.ReactNode;
  floatingPanel?: React.ReactNode;
}

export function PlayerShell({
  children,
  sidebar,
  navbar,
  floatingPanel,
}: PlayerShellProps) {
  return (
    <AppShell sidebar={sidebar} navbar={navbar} floatingPanel={floatingPanel}>
      {children}
    </AppShell>
  );
}
