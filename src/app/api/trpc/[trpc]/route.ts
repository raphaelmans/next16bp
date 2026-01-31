import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@/lib/shared/infra/trpc/context";
import { appRouter } from "@/lib/shared/infra/trpc/root";

/**
 * tRPC HTTP handler for Next.js App Router.
 * Handles all tRPC requests at /api/trpc/*
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
