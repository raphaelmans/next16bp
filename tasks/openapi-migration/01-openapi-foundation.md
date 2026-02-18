# OpenAPI Migration - Foundation

## 1) Add spec route

- Implement `GET /api/mobile/v1/openapi.json`.
- The route returns an OpenAPI 3.1 document.

Files:
- `src/app/api/mobile/v1/openapi.json/route.ts`
- `src/lib/shared/infra/openapi/mobile-v1.document.ts`

## 2) Define shared OpenAPI conventions

- `bearerAuth` security scheme for Supabase access token.
- Standard success/error envelopes.
- Operation IDs map to capability names where possible.

## 3) Route handler template

For all mobile routes:

- `export const runtime = "nodejs"` (server libraries used, including Supabase and Buffer)
- `export const dynamic = "force-dynamic"` (no caching by default)
- Use `getRequestId(req)` + `handleError(error, requestId)`.
- Use `requireMobileSession(req)` for protected routes.
- Use `enforceRateLimit({ identifier: session.userId, tier, requestId })`.

## 4) Proxy exclusion

- Update `src/proxy.ts` to skip Supabase cookie refresh for `/api/mobile/**`.
- Reason: mobile endpoints are Bearer-token based; avoid unnecessary per-request Supabase calls.
