# Mobile OpenAPI REST API (v1)

Contract-first REST API documentation for mobile clients, with primary support for:

- `/Users/raphaelm/Documents/Coding/kudoscourts-expo`

This guide documents the current `/api/mobile/v1/**` surface, implementation boundaries, and how backend and mobile teams coordinate changes.

## Overview

The mobile API exists to expose owner and public capabilities to Expo clients while keeping the existing web transport intact.

- Web app transport remains tRPC (`/api/trpc/**`).
- Mobile transport uses REST + OpenAPI (`/api/mobile/v1/**`).
- Contracts are Zod-first and OpenAPI is generated from those contracts.

Quick links:

- OpenAPI spec endpoint: `/api/mobile/v1/openapi.json`
- OpenAPI document builder: `src/lib/shared/infra/openapi/mobile-v1.document.ts`
- Route handlers: `src/app/api/mobile/v1/**/route.ts`
- Migration wave notes: `tasks/openapi-migration/*.md`

## Architecture and Layering

This follows the same layered architecture principles from `/Users/raphaelm/Documents/Coding/node-architecture/server/README.md`: thin transport adapters over shared services/use-cases.

```text
Expo Mobile App
    |
    v
/api/mobile/v1 Route Handlers (Next.js App Router)
    - parse request
    - validate with Zod
    - auth + rate limit
    - map response envelope
    |
    v
Services / Use-cases (src/lib/modules/**)
    |
    v
Repositories + Database
```

### Implementation Boundaries

- `src/app/api/mobile/v1/**/route.ts`
  - Transport concerns only.
  - No business logic duplication.
- `src/lib/modules/**`
  - Domain logic source of truth.
- `src/lib/shared/infra/openapi/mobile-v1.document.ts`
  - OpenAPI 3.1 contract definition for mobile endpoints.

## API Base and Versioning

- Base path: `/api/mobile/v1`
- OpenAPI document: `GET /api/mobile/v1/openapi.json`
- Versioning policy: additive changes preferred inside `v1`; breaking changes require a new versioned namespace.

## Authentication and Authorization

Protected mobile routes require Supabase bearer tokens:

- Header: `Authorization: Bearer <supabase_access_token>`

Server-side flow (`src/lib/shared/infra/auth/mobile-session.ts`):

1. Parse bearer token from `Authorization` header.
2. Validate token via Supabase admin client (`auth.getUser(token)`).
3. Resolve role from `user_roles`.
4. Produce session shape: `{ userId, email, role }`.

If token is missing or invalid, routes throw `AuthenticationError` and return 401 via the standard error envelope.

## Response and Error Contract

Success envelope:

```json
{
  "data": {}
}
```

Error envelope:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "requestId": "a1b2c3d4",
  "details": {}
}
```

Source references:

- Error mapper: `src/lib/shared/infra/http/error-handler.ts`
- Error classes/status mapping: `src/lib/shared/kernel/errors.ts`
- Envelope helper: `src/lib/shared/utils/response.ts`

## Rate Limiting

Mobile routes enforce tiered limits via `enforceRateLimit`:

- Helper: `src/lib/shared/infra/http/http-rate-limit.ts`
- Tiers: `src/lib/shared/infra/ratelimit/config.ts`

Common tiers used in mobile routes:

- `default`
- `mutation`
- `sensitive`
- `chatSession`
- `chatSend`
- `aiNormalize`

Owner endpoints typically key limits by `session.userId` to prevent IP-level collisions for authenticated traffic.

## Proxy Behavior for Mobile Routes

`src/proxy.ts` excludes `/api/mobile/**` from the proxy matcher entirely.

```text
matcher: "/((?!_next/static|_next/image|favicon.ico|api/mobile/|...)*)"
```

Why excluded (not just early-returned):

- Mobile API is bearer-token based — no Supabase cookie/session refresh needed.
- **Next.js 16 proxy bug**: returning `NextResponse.next()` from proxy for `/api/mobile/` paths causes a 404 (HTML not-found page) instead of routing to the compiled route handlers. This is a Turbopack routing issue in Next.js 16.1.0 where `NextResponse.next()` fails to resolve certain API route paths when returned early from the proxy function.
- `NextResponse.rewrite()` to the same paths works correctly (the `/api/v1/` -> `/api/mobile/v1/` rewrite continues to function).
- Excluding the paths from the matcher bypasses the bug entirely.

The `/api/v1/` alias rewrite still works because `/api/v1/` is NOT excluded from the matcher — the proxy rewrites it to `/api/mobile/v1/` via `NextResponse.rewrite()`, which resolves correctly.

## Endpoint Surface (Current)

### Auth

- `GET /auth/me`

### Push Tokens (Mobile Push)

- `PUT /push-tokens`
- `DELETE /push-tokens`

### Owner Setup

- `GET /organization/setup/status`

### Organizations + Profile + Logo

- `GET /organization/organizations`
- `POST /organization/organizations`
- `GET /organization/organizations/{organizationId}`
- `PATCH /organization/organizations/{organizationId}`
- `PATCH /organization/organizations/{organizationId}/profile`
- `POST /organization/organizations/{organizationId}/logo`

### Venues (Places) + Photos + Courts

- `GET /organization/organizations/{organizationId}/venues`
- `POST /organization/organizations/{organizationId}/venues`
- `GET /organization/venues/{venueId}`
- `PATCH /organization/venues/{venueId}`
- `DELETE /organization/venues/{venueId}`
- `POST /organization/venues/{venueId}/photos`
- `DELETE /organization/venues/{venueId}/photos/{photoId}`
- `POST /organization/venues/{venueId}/photos/reorder`
- `GET /organization/venues/{venueId}/courts`
- `POST /organization/venues/{venueId}/courts`

### Courts + Blocks + Hours + Pricing

- `GET /organization/courts/{courtId}`
- `PATCH /organization/courts/{courtId}`
- `GET /organization/courts/{courtId}/hours`
- `PUT /organization/courts/{courtId}/hours`
- `POST /organization/courts/{courtId}/hours/copy-from`
- `GET /organization/courts/{courtId}/rate-rules`
- `PUT /organization/courts/{courtId}/rate-rules`
- `POST /organization/courts/{courtId}/rate-rules/copy-from`
- `GET /organization/courts/{courtId}/blocks`
- `POST /organization/courts/{courtId}/blocks/maintenance`
- `POST /organization/courts/{courtId}/blocks/walk-in`
- `POST /organization/blocks/{blockId}/cancel`
- `PATCH /organization/blocks/{blockId}/range`
- `POST /organization/blocks/{blockId}/convert-to-guest`

### Reservations + Guest Bookings

- `GET /organization/organizations/{organizationId}/reservations`
- `GET /organization/organizations/{organizationId}/reservations/pending-count`
- `GET /organization/courts/{courtId}/reservations/pending`
- `GET /organization/courts/{courtId}/reservations/active`
- `POST /organization/reservations/{reservationId}/accept`
- `POST /organization/reservations/{reservationId}/reject`
- `POST /organization/reservations/{reservationId}/confirm-payment`
- `POST /organization/reservations/{reservationId}/confirm-paid-offline`
- `GET /organization/reservations/{reservationId}/history`
- `POST /organization/reservations/guest-booking`

### Payment Methods

- `GET /organization/organizations/{organizationId}/payment-methods`
- `POST /organization/organizations/{organizationId}/payment-methods`
- `PATCH /organization/payment-methods/{paymentMethodId}`
- `DELETE /organization/payment-methods/{paymentMethodId}`
- `POST /organization/payment-methods/{paymentMethodId}/set-default`

### Claims + Verification + Removals

- `GET /organization/claims`
- `POST /organization/claims`
- `GET /organization/claims/{requestId}`
- `POST /organization/claims/{requestId}/cancel`
- `POST /organization/removals`
- `GET /organization/venues/{venueId}/verification`
- `POST /organization/venues/{venueId}/verification/submit`
- `POST /organization/venues/{venueId}/reservations/toggle`

### Bookings Import

- `POST /organization/import/bookings`
- `GET /organization/import/bookings/jobs`
- `GET /organization/import/bookings/jobs/{jobId}`
- `GET /organization/import/bookings/jobs/{jobId}/rows`
- `GET /organization/import/bookings/jobs/{jobId}/sources`
- `POST /organization/import/bookings/jobs/{jobId}/discard`
- `POST /organization/import/bookings/jobs/{jobId}/normalize`
- `POST /organization/import/bookings/jobs/{jobId}/commit`
- `PATCH /organization/import/bookings/rows/{rowId}`
- `DELETE /organization/import/bookings/rows/{rowId}`
- `POST /organization/import/bookings/rows/{rowId}/replace-with-guest`
- `GET /organization/import/bookings/ai-usage`

### Chat (Owner)

- `GET /organization/chat/auth`
- `GET /organization/chat/reservations/{reservationId}/session`
- `POST /organization/chat/reservations/{reservationId}/messages`
- `GET /organization/chat/reservations/thread-metas`
- `GET /organization/chat/claims/{claimRequestId}/session`
- `POST /organization/chat/claims/{claimRequestId}/messages`
- `GET /organization/chat/verifications/{placeVerificationRequestId}/session`
- `POST /organization/chat/verifications/{placeVerificationRequestId}/messages`

### Public

- `GET /public/sports`
- `GET /public/venues`
- `GET /public/venues/{placeIdOrSlug}`

For request/response schemas and operation IDs, use the generated spec at runtime.

Push token endpoints are used by Expo clients to register/revoke `ExponentPushToken[...]` values. These tokens are persisted in `mobile_push_token` and consumed by the notification outbox dispatcher through the `MOBILE_PUSH` channel.

## Route Handler Standard

The mobile routes consistently use:

- `export const runtime = "nodejs"`
- `export const dynamic = "force-dynamic"`
- `getRequestId(req)` for traceability
- `handleError(error, requestId)` for normalized error output
- `requireMobileSession(req)` on protected routes
- `enforceRateLimit({ req, tier, requestId, identifier })`

## Local Development and Consumer Validation

Start API locally from repo root:

```bash
pnpm dev
```

Check spec locally:

```bash
curl -s http://localhost:3000/api/mobile/v1/openapi.json | jq '.info,.servers'
```

Check authenticated route:

```bash
curl -i \
  -H "Authorization: Bearer <supabase_access_token>" \
  http://localhost:3000/api/mobile/v1/auth/me
```

For `/Users/raphaelm/Documents/Coding/kudoscourts-expo`:

1. Point API base to this server instance.
2. Use Supabase-authenticated user tokens in bearer headers.
3. Validate expected envelopes and error semantics against this spec.

## Contract-First Workflow (Server -> Mobile)

This repo is the contract source of truth for mobile REST behavior.

### Change Sequence

1. Update or add backend route handler under `src/app/api/mobile/v1/**/route.ts`.
2. Reuse domain services/use-cases under `src/lib/modules/**`.
3. Update `src/lib/shared/infra/openapi/mobile-v1.document.ts` so the spec remains accurate.
4. Validate auth, rate limits, and response envelopes.
5. Update mobile client in `/Users/raphaelm/Documents/Coding/kudoscourts-expo` to consume the updated contract.

### Parity Checklist

For capabilities that exist in both tRPC and mobile REST:

- Same Zod validation intent.
- Equivalent authorization boundaries.
- Equivalent rate-limit class for risk profile.
- Equivalent success and error semantics.
- Compatible business-event side effects.

## Migration Task References

Implementation wave docs:

- `tasks/openapi-migration/00-overview.md`
- `tasks/openapi-migration/01-openapi-foundation.md`
- `tasks/openapi-migration/02-auth.md`
- `tasks/openapi-migration/03-owner-setup.md`
- `tasks/openapi-migration/04-organizations.md`
- `tasks/openapi-migration/05-venues.md`
- `tasks/openapi-migration/06-courts.md`
- `tasks/openapi-migration/07-hours-and-pricing.md`
- `tasks/openapi-migration/08-owner-reservations.md`
- `tasks/openapi-migration/09-guest-and-walkins.md`
- `tasks/openapi-migration/10-payment-methods.md`
- `tasks/openapi-migration/11-claims-and-verification.md`
- `tasks/openapi-migration/12-bookings-import.md`
- `tasks/openapi-migration/13-chat.md`
- `tasks/openapi-migration/99-rollout-parity.md`

## Troubleshooting

### 404 on all `/api/mobile/` routes (Next.js 16 proxy bug)

Symptom: every `/api/mobile/v1/**` route returns an HTML 404 page, while `/api/public/`, `/api/trpc/`, and `/api/cron/` routes work normally. The dev server log shows a compile + render cycle (not a missing-file error).

Root cause: `NextResponse.next()` returned from the proxy function for `/api/mobile/` paths does not resolve route handlers in Next.js 16.1.0 with Turbopack. This is a framework-level bug — the routes compile, appear in `.next/dev/server/app-paths-manifest.json`, and have valid `route.ts` exports, but the proxy pass-through fails to connect them.

Diagnosis:

```bash
# Direct access — returns 404 (broken when proxy handles it)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/mobile/v1/public/sports

# Rewrite via /api/v1/ — returns 200 (works, uses NextResponse.rewrite())
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/public/sports
```

Fix: exclude `api/mobile/` from the proxy matcher so the proxy never runs for these paths. See the "Proxy Behavior for Mobile Routes" section above.

If this is resolved in a future Next.js release, the matcher exclusion can be removed — it has no functional side effects since mobile routes use Bearer tokens, not cookies.

### 401 on protected endpoints

- Ensure `Authorization: Bearer <token>` is set.
- Confirm token is a Supabase access token for this environment.

### 400 validation errors

- Compare request payload/query/path against OpenAPI spec.
- Check `details.issues` in error response for exact failing fields.

### 429 responses

- Confirm which rate-limit tier applies to the endpoint.
- Retry with backoff and avoid tight client retry loops.

### Spec mismatch concerns

- Treat `src/lib/shared/infra/openapi/mobile-v1.document.ts` and route handlers as authoritative.
- If they drift, update the document in the same change as route behavior.
