"use client";

import { ShieldAlert } from "lucide-react";

interface NoAccessViewProps {
  title?: string;
  message?: string;
}

/**
 * Amber-toned "access restricted" fallback matching the existing pattern
 * from owner-team-page.tsx (the canManage === false branch).
 */
export function NoAccessView({
  title = "Access Restricted",
  message = "You do not have permission to view this page. Ask an owner or manager with the required access.",
}: NoAccessViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="h-4 w-4" />
          {title}
        </div>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  );
}
