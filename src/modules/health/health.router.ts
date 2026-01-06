import { router, publicProcedure } from "@/shared/infra/trpc/trpc";

/**
 * Health check response schema
 */
interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

/**
 * Health router for server status checks.
 */
export const healthRouter = router({
  /**
   * Basic health check endpoint.
   * Returns server status, timestamp, and uptime.
   */
  check: publicProcedure.query((): HealthCheckResponse => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }),
});
