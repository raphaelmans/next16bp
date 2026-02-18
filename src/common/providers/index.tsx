"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense, useState } from "react";
import { RouteScrollManager } from "@/common/providers/route-scroll-manager";
import { NavigationProgress } from "@/components/navigation/navigation-progress";
import { Toaster } from "@/components/ui/sonner";
import { trpc } from "@/trpc/client";
import { createTrpcLinks } from "@/trpc/links";
import { getQueryClient } from "@/trpc/query-client";

/**
 * Root providers component.
 * Wraps the application with QueryClientProvider and tRPC Provider.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: createTrpcLinks(),
    }),
  );

  return (
    <NuqsAdapter>
      <NavigationProgress />
      <Suspense fallback={null}>
        <RouteScrollManager />
      </Suspense>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </trpc.Provider>
    </NuqsAdapter>
  );
}
