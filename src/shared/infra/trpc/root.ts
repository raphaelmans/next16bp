import { router } from "./trpc";
import { healthRouter } from "@/modules/health/health.router";
import { authRouter } from "@/modules/auth/auth.router";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
});

/**
 * Type export for client-side usage.
 * This is used to infer the types for the tRPC client.
 */
export type AppRouter = typeof appRouter;
