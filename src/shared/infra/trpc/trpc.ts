import { initTRPC, TRPCError } from "@trpc/server";
import { AppError, AuthenticationError } from "@/shared/kernel/errors";
import type { Context, AuthenticatedContext } from "./context";

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
          requestId,
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
        requestId,
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
 * Logger middleware - request lifecycle tracing.
 * Defined inline to avoid circular dependency with middleware exports.
 */
const loggerMiddleware = t.middleware(async ({ ctx, next, type }) => {
  const start = Date.now();

  ctx.log.info({ type }, "Request started");

  // Log input at debug level only in development
  if (process.env.NODE_ENV !== "production") {
    ctx.log.debug("Request processing");
  }

  try {
    const result = await next({ ctx });
    const duration = Date.now() - start;

    ctx.log.info({ duration, status: "success", type }, "Request completed");

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    ctx.log.info({ duration, status: "error", type }, "Request failed");

    throw error;
  }
});

/**
 * Auth middleware - requires valid session.
 * Defined inline to avoid circular dependency.
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: new AuthenticationError("Authentication required"),
    });
  }

  return next({
    ctx: ctx as AuthenticatedContext,
  });
});

/**
 * Base procedure with logging - all procedures use this
 */
const loggedProcedure = t.procedure.use(loggerMiddleware);

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = loggedProcedure;

/**
 * Protected procedure - authentication required
 */
export const protectedProcedure = loggedProcedure.use(authMiddleware);
