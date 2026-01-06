import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/shared/infra/trpc/root";
import { createContext } from "@/shared/infra/trpc/context";

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
