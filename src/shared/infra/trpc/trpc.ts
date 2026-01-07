import { initTRPC, TRPCError } from "@trpc/server";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
} from "@/shared/kernel/errors";
import type { Context, AuthenticatedContext } from "./context";
import { createRateLimitMiddleware } from "./middleware/ratelimit.middleware";
import type { RateLimitTier } from "../ratelimit";

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

/**
 * Admin middleware - requires admin role.
 * Must be authenticated and have role === "admin".
 */
const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: new AuthenticationError("Authentication required"),
    });
  }

  if (ctx.session.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
      cause: new AuthorizationError("Admin access required"),
    });
  }

  return next({
    ctx: ctx as AuthenticatedContext,
  });
});

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = loggedProcedure.use(adminMiddleware);

/**
 * Rate-limited public procedure factory.
 * @param tier - The rate limit tier to apply
 */
export const rateLimitedProcedure = (tier: RateLimitTier) =>
  publicProcedure.use(createRateLimitMiddleware(tier));

/**
 * Rate-limited protected procedure factory.
 * Requires authentication + applies rate limiting.
 * @param tier - The rate limit tier to apply
 */
export const protectedRateLimitedProcedure = (tier: RateLimitTier) =>
  protectedProcedure.use(createRateLimitMiddleware(tier));

/**
 * Rate-limited admin procedure factory.
 * Requires admin role + applies rate limiting.
 * @param tier - The rate limit tier to apply
 */
export const adminRateLimitedProcedure = (tier: RateLimitTier) =>
  adminProcedure.use(createRateLimitMiddleware(tier));
