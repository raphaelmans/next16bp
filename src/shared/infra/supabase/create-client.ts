import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

/**
 * Creates a Supabase server client with cookie handling for SSR.
 * Used in tRPC context and auth routes.
 */
export function createClient(
  url: string,
  key: string,
  cookies: CookieMethodsServer,
) {
  return createServerClient(url, key, { cookies });
}
