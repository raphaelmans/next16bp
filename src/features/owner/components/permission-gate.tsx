"use client";

import type { ReactNode } from "react";
import type { PageAccessRule } from "@/features/owner/helpers";
import { canAccessPage } from "@/features/owner/helpers";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import { NoAccessView } from "./no-access-view";

interface PermissionGateProps {
  accessRule: PageAccessRule;
  children: ReactNode;
  /** Optional custom fallback — defaults to NoAccessView. */
  fallback?: ReactNode;
}

/**
 * Evaluates the current user's permission context against an access rule.
 * Renders children when access is granted; otherwise renders a fallback.
 *
 * While the permission context is still loading, renders nothing (the
 * page's own loading skeleton should handle that phase).
 */
export function PermissionGate({
  accessRule,
  children,
  fallback,
}: PermissionGateProps) {
  const { permissionContext, isLoading } = useModOwnerPermissionContext();

  if (isLoading || !permissionContext) {
    return null;
  }

  if (!canAccessPage(permissionContext, accessRule)) {
    return <>{fallback ?? <NoAccessView />}</>;
  }

  return <>{children}</>;
}
