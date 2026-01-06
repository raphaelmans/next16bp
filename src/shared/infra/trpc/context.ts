import { randomUUID } from "crypto";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createRequestLogger } from "@/shared/infra/logger";

/**
 * Creates the tRPC context for each request.
 * Generates a unique requestId for correlation and logging.
 */
export async function createContext({ req }: FetchCreateContextFnOptions) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();

  const log = createRequestLogger({
    requestId,
    method: req.method,
    path: new URL(req.url).pathname,
  });

  return {
    requestId,
    log,
    // Future extensions:
    // userId: undefined, // Set by auth middleware
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
