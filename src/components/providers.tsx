"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  splitLink,
} from "@trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import type { AppRouter } from "@/shared/infra/trpc/root";
import { TRPCProvider } from "@/trpc/client";
import { getQueryClient } from "@/trpc/query-client";

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
        splitLink({
          // Route FormData/File/Blob to non-batched endpoint
          // httpLink handles non-JSON content types natively in tRPC v11
          condition: (op) => isNonJsonSerializable(op.input),
          true: httpLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
          // Regular JSON uses batched endpoint for efficiency
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
        }),
      ],
    }),
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
