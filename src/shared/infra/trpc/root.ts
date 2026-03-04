import { authRouter } from "@/modules/auth/auth.router";
import { healthRouter } from "@/modules/health/health.router";
import { profileRouter } from "@/modules/profile/profile.router";
import { router } from "./trpc";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  profile: profileRouter,
});

/**
 * Type export for client-side usage.
 * This is used to infer the types for the tRPC client.
 */
export type AppRouter = typeof appRouter;
