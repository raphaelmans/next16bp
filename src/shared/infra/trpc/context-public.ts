import type { CookieMethodsServer } from "@supabase/ssr";
import { env } from "@/lib/env";
import { createRequestLogger } from "@/shared/infra/logger";
import { appRoutes } from "@/shared/lib/app-routes";
import type { Context } from "./context";

const buildPublicOrigin = () =>
  env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const createCookieMethods = (): CookieMethodsServer => ({
  getAll: () => [],
  setAll: () => {},
});

export async function createPublicContext(): Promise<Context> {
  const requestId = globalThis.crypto.randomUUID();

  return {
    requestId,
    session: null,
    userId: null,
    cookies: createCookieMethods(),
    origin: buildPublicOrigin(),
    log: createRequestLogger({
      requestId,
      method: "GET",
      path: appRoutes.index.base,
    }),
  };
}
