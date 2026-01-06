import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";
import type { AuthenticatedContext } from "../context";
import { AuthenticationError } from "@/shared/kernel/errors";

/**
 * Auth middleware - requires valid session
 * Throws UNAUTHORIZED if no session is present
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
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
