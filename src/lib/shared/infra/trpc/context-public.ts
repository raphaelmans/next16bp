import type { CookieMethodsServer } from "@supabase/ssr";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { createRequestLogger } from "@/lib/shared/infra/logger";
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
    clientIdentifier: "anon:fallback",
    clientIdentifierSource: "fallback",
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
