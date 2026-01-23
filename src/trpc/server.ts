import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createPublicContext } from "@/shared/infra/trpc/context-public";
import { type AppRouter, appRouter } from "@/shared/infra/trpc/root";
import { createCallerFactory } from "@/shared/infra/trpc/trpc";
import { getQueryClient as getBaseQueryClient } from "@/trpc/query-client";

export const getQueryClient = cache(getBaseQueryClient);

export const publicCaller = createCallerFactory(appRouter)(createPublicContext);

export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
  publicCaller,
  getQueryClient,
);
