"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function HealthCheck() {
  const trpc = useTRPC();
  const { data, isLoading, isError, error } = useQuery(
    trpc.health.check.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg bg-yellow-100 px-4 py-2 text-sm text-yellow-800 shadow-lg">
        Checking health...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800 shadow-lg">
        Health check failed: {error?.message}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 rounded-lg bg-green-100 px-4 py-2 text-sm text-green-800 shadow-lg">
      <div className="font-medium">Server: {data?.status}</div>
      <div className="text-xs opacity-75">
        Uptime: {Math.floor(data?.uptime ?? 0)}s
      </div>
    </div>
  );
}
