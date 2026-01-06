"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@/shared/infra/trpc/root";

/**
 * tRPC client-side context exports.
 * - TRPCProvider: Wraps the app with tRPC context
 * - useTRPC: Hook to access tRPC client for queries/mutations
 * - useTRPCClient: Hook to access the raw tRPC client
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
