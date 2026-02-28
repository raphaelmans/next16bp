/**
 * Returns the client-facing origin for the given request.
 *
 * Behind reverse proxies and tunnels (e.g. ngrok, Cloudflare Tunnel),
 * `request.url` resolves to the internal address (localhost:3000).
 * This helper checks `x-forwarded-host` / `x-forwarded-proto` first,
 * so redirects point back to the external URL the browser is using.
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
