"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { TRPCProvider } from "@/trpc/client";
import { getQueryClient } from "@/trpc/query-client";
import type { AppRouter } from "@/shared/infra/trpc/root";

/**
 * Returns the base URL for tRPC requests.
 * Handles both server-side and client-side rendering.
 */
function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Browser should use relative path
    return "";
  }
  // SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Root providers component.
 * Wraps the application with QueryClientProvider and TRPCProvider.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
