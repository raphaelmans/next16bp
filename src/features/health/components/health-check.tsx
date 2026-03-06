"use client";

import { useQueryHealthCheck } from "@/features/health/hooks";

export function HealthCheck() {
  const { data, isLoading, isError, error } = useQueryHealthCheck();

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg bg-yellow-100 px-4 py-2 text-sm text-yellow-800 shadow-lg">
        Checking health...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg bg-destructive-light px-4 py-2 text-sm text-destructive shadow-lg">
        Health check failed: {error?.message}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 rounded-lg bg-success/10 px-4 py-2 text-sm text-success shadow-lg">
      <div className="font-medium">Server: {data?.status}</div>
      <div className="text-xs opacity-75">
        Uptime: {Math.floor(data?.uptime ?? 0)}s
      </div>
    </div>
  );
}
