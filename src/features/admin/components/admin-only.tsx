"use client";

import * as React from "react";

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isAdmin?: boolean;
}

/**
 * Conditionally renders children based on admin role.
 * Used for showing/hiding admin-specific UI elements.
 */
export function AdminOnly({
  children,
  fallback = null,
  isAdmin = true,
}: AdminOnlyProps) {
  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
