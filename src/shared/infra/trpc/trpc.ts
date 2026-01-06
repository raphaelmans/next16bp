import { initTRPC, TRPCError } from "@trpc/server";
import { AppError } from "@/shared/kernel/errors";
import type { Context } from "./context";

/**
 * tRPC initialization with error formatter.
 * Maps AppError to structured tRPC error responses.
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ error, shape, ctx }) {
    const cause = error.cause;
    const requestId = ctx?.requestId ?? "unknown";

    // Known application error
    if (cause instanceof AppError) {
      ctx?.log.warn(
        {
          err: cause,
          code: cause.code,
          details: cause.details,
        },
        cause.message,
      );

      return {
        ...shape,
        data: {
          ...shape.data,
          code: cause.code,
          httpStatus: cause.httpStatus,
          requestId,
          details: cause.details,
        },
      };
    }

    // Unknown error
    ctx?.log.error(
      {
        err: error,
      },
      "Unexpected error",
    );

    return {
      ...shape,
      data: {
        ...shape.data,
        code: "INTERNAL_ERROR",
        requestId,
      },
    };
  },
});

/**
 * Router and procedure exports
 */
export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - authentication required (to be implemented)
 * For now, it's the same as publicProcedure.
 */
export const protectedProcedure = t.procedure;
