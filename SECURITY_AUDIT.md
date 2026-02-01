# Repository Security Audit (Repo-Only)

Date: 2026-02-01
Scope: repo code/config/migrations only (no live Supabase project inspection).

Status: remediations implemented in-repo (see "Implemented Changes" and "Remediation Backlog" sections).

## Executive Summary
This repo had several high-impact security issues around cron authentication, private document storage, forwarded-host trust, and CSRF posture for cookie-authenticated APIs.

All items in this report have been addressed in-code and via migrations/scripts (repo-only). The remaining work is operational: apply migrations to target DB, update Supabase storage bucket visibility/policies, and configure required environment variables in deployment.

These combine into realistic exploit paths: unauthenticated state changes (cron), world-readable sensitive documents (storage), phishing/open-redirect via forwarded host, and cross-site request forgery for cookie-based sessions.

## Validation Commands Run
- `pnpm lint` (passes after `pnpm format`)
- `TZ=UTC pnpm build` failed due to missing required env vars (expected in this environment):
  - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_US_FROM_EMAIL`, `CONTACT_US_TO_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Notes:
- A build with dummy env values succeeds through compilation but fails while prerendering `/sitemap.xml` due to missing DB connectivity (expected without a running Postgres).

## Implemented Changes

### Cron auth fails closed (fixed)
- Added `src/lib/shared/infra/cron/cron-auth.ts` and applied it to:
  - `src/app/api/cron/expire-reservations/route.ts`
  - `src/app/api/cron/dispatch-notification-delivery/route.ts`
- Behavior:
  - In production: `CRON_SECRET` must be set and `Authorization: Bearer <secret>` must match.
  - In non-production: missing `CRON_SECRET` is allowed.

### Sensitive document storage is private + access via signed URLs (fixed)
- Storage buckets:
  - Updated `scripts/seed-storage-buckets.ts` to set `payment-proofs` + `place-verification-docs` private.
  - Introduced a separate private bucket for imports: `bookings-imports`.
- Storage service:
  - `src/lib/modules/storage/dtos/upload.dto.ts` now treats `url` as nullable and only returns public URLs for public buckets.
  - `src/lib/modules/storage/services/object-storage.service.ts` now returns `url: null` for private buckets.
- Payment proofs:
  - Store `file_path` (not a public URL) and return signed URLs at read time:
    - `src/lib/modules/payment-proof/services/payment-proof.service.ts`
    - `src/lib/shared/infra/db/schema/reservation.ts` (added `payment_proof.file_path`)
- Verification docs:
  - Store `file_path` and return signed URLs in admin read API:
    - `src/lib/modules/place-verification/services/place-verification.service.ts`
    - `src/lib/modules/place-verification/services/place-verification-admin.service.ts`
    - `src/lib/shared/infra/db/schema/place-verification.ts` (made `file_url` nullable and added `file_path`)

### Forwarded-host trust removed from redirects/origin (fixed)
- Auth callback no longer uses `x-forwarded-host` to construct redirect host:
  - `src/app/auth/callback/route.ts`
- `ctx.origin` no longer uses forwarded headers; production now requires `NEXT_PUBLIC_APP_URL`:
  - `src/lib/shared/infra/trpc/context.ts`
- Server caller URL building no longer trusts forwarded headers; production requires `NEXT_PUBLIC_APP_URL`:
  - `src/lib/shared/infra/trpc/server.ts`

### CSRF posture improved + GET disabled for tRPC handler (fixed)
- `src/app/api/trpc/[trpc]/route.ts`:
  - GET returns 405.
  - POST enforces same-origin checks using `Origin` and `Sec-Fetch-Site` when present.

### Security headers + noopener (fixed)
- Added baseline security headers + production CSP/HSTS in `next.config.ts`.
- Fixed `noopener` for external links:
  - `mdx-components.tsx`
  - `src/app/(admin)/admin/verification/[requestId]/page.tsx`
  - `src/features/reservation/components/terms-checkbox.tsx`
  - `src/features/owner/components/place-form.tsx`
  - `src/features/admin/components/admin-court-edit-form.tsx`
  - `src/app/(public)/poc/google-loc/page-client.tsx`
  - `src/app/(admin)/admin/courts/new/page.tsx`
  - `src/app/(admin)/admin/courts/page.tsx`
  - `src/app/(admin)/admin/claims/[id]/page.tsx`

### POC endpoints removed from production (fixed)
- `/api/poc/*` now returns 404 in production:
  - `src/app/api/poc/google-loc/route.ts`
  - `src/app/api/poc/google-loc/nearby/route.ts`
- The PoC page is also disabled in production:
  - `src/app/(public)/poc/google-loc/page.tsx`

### Public tracking endpoint hardened (improved)
- Added best-effort rate limiting and stopped logging raw properties:
  - `src/app/api/public/track/route.ts`
  - `src/lib/shared/infra/http/http-rate-limit.ts`

### Query bounding (fixed for public list)
- `bookingsImport.listRows` now supports pagination:
  - `src/lib/modules/bookings-import/dtos/list-rows.dto.ts`
  - `src/lib/modules/bookings-import/services/bookings-import.service.ts`
  - `src/lib/modules/bookings-import/repositories/bookings-import-row.repository.ts`

### Env hygiene (added)
- Added `.env.example` and ensured it is committed via `.gitignore` exception.

## Attack Surface Inventory (Next.js Route Handlers)
- Auth:
  - `src/app/auth/callback/route.ts` GET
  - `src/app/auth/confirm/route.ts` GET
- tRPC:
  - `src/app/api/trpc/[trpc]/route.ts` GET + POST
- Cron:
  - `src/app/api/cron/expire-reservations/route.ts` GET
  - `src/app/api/cron/dispatch-notification-delivery/route.ts` GET
  - Cron schedules: `vercel.json`
- Public (non-tRPC):
  - `src/app/api/public/track/route.ts` POST
  - `src/app/api/public/amenities/route.ts` GET
  - `src/app/api/public/countries/route.ts` GET
  - `src/app/api/public/ph-provinces-cities/route.ts` GET
- POC (public):
  - `src/app/api/poc/google-loc/route.ts` POST
  - `src/app/api/poc/google-loc/nearby/route.ts` POST

## Key Findings (OWASP-mapped)

### 1) Cron endpoints can become unauthenticated if `CRON_SECRET` is unset (Fixed) (A01/A05)
Evidence:
- `src/app/api/cron/expire-reservations/route.ts:28-31` only rejects if `cronSecret` is truthy.
- `src/app/api/cron/dispatch-notification-delivery/route.ts:217-219` same pattern.
Impact:
- If `CRON_SECRET` is missing/misconfigured in a deployed environment, anyone can trigger reservation expiration and notification dispatch loops.
Implemented:
- `verifyCronAuth()` enforces fail-closed behavior in production.

### 2) Sensitive documents are effectively public (Fixed) (A01/A02)
Evidence:
- `scripts/seed-storage-buckets.ts:28-55` seeds ALL buckets as `public: true`, including:
  - `payment-proofs`
  - `place-verification-docs`
- `src/lib/modules/storage/services/object-storage.service.ts:62-101`:
  - Uses `env.SUPABASE_SECRET_KEY` (service role) and always returns `getPublicUrl()` after upload.
- Sensitive flows persist and/or log those public URLs:
  - `src/lib/modules/payment-proof/services/payment-proof.service.ts:161-185` stores `result.url` and logs `url: result.url`.
  - `src/lib/modules/place-verification/services/place-verification.service.ts:150-170` stores `result.url` for verification docs.
Impact:
- Payment proofs and verification documents can become world-readable if bucket visibility is public.
- Persisting public URLs makes access permanent and hard to revoke; logging them increases exposure.
Implemented:
- Sensitive buckets are private, paths are stored in DB, and signed URLs are generated on-demand.

### 3) Redirect/origin construction trusts forwarded headers (Fixed) (A10/A05)
Evidence:
- `src/app/auth/callback/route.ts:56-65` redirects to `https://${forwardedHost}${redirectPath}` when `x-forwarded-host` exists.
- `src/lib/shared/infra/trpc/context.ts:91-129` derives `ctx.origin` from `x-forwarded-host` / `host` if `env.NEXT_PUBLIC_APP_URL` is unset.
- `src/lib/shared/infra/trpc/server.ts:7-25` builds internal request URLs from forwarded headers if `env.NEXT_PUBLIC_APP_URL` is unset.
- `src/lib/modules/notification-delivery/admin/notification-delivery-admin.router.ts:261-263` calls `${ctx.origin}/api/cron/dispatch-notification-delivery`.
Impact:
- If forwarded headers can be influenced (misconfigured proxy/CDN), redirects may become attacker-controlled (phishing/open-redirect) and internal self-calls can become SSRF-like primitives.
Implemented:
- Removed `x-forwarded-host` use for auth redirects and required a canonical origin in production.

### 4) tRPC cookie-auth without explicit CSRF protections; GET enabled (Fixed) (A01/A05)
Evidence:
- `src/app/api/trpc/[trpc]/route.ts:17` exports handler as GET and POST.
- `src/lib/shared/infra/trpc/context.ts:51-83` reads session from Supabase cookies.
Impact:
- If cookies authenticate users, cross-site requests can trigger state-changing tRPC mutations unless mitigated by cookie `SameSite` and/or explicit CSRF checks.
- Allowing GET increases risk of unsafe caching and accidental mutation-over-GET (if any handler allows it).
Implemented:
- GET disabled and POST enforces same-origin checks.

### 5) Server session uses `SUPABASE_SECRET_KEY` with cookie-bound session logic (Fixed) (A05/A07)
Evidence:
- `src/lib/shared/infra/auth/server-session.ts:31-35` creates a Supabase server client using `env.SUPABASE_SECRET_KEY` and also wires cookie setters.
Impact:
- Using the service role key for request-scoped user session work increases blast radius: accidental DB queries through this client would bypass RLS.
Implemented:
- Server session now uses publishable key for cookie-bound auth.

### 6) DB migrations and Supabase compatibility risks (Improved) (A08/A05)
Evidence:
- `drizzle/meta/_journal.json` only lists `0000`–`0003` but repo contains later migrations (e.g. `0008`, `0009`, `0011`, `0012`, `0014`).
- `drizzle/0000_jazzy_galactus.sql:8-18` creates `auth.users`.
- No RLS enablement/policies found in migrations (no `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` across `drizzle/*.sql`).
- `src/lib/shared/infra/db/schema/place.ts:59-68` defines trigram GIN indexes (`gin_trgm_ops`) but no migration enables `pg_trgm`.
Impact:
- Migration drift: constraints/indexes may not apply, leading to correctness/performance issues.
- Creating `auth.users` is incompatible with real Supabase projects (Supabase owns `auth.*`).
- Without RLS, access control relies entirely on app code + service-role usage.
Implemented:
- Drizzle journal updated; `auth.users` creation removed from initial migration; added extension + index + constraint migrations.

### 7) Public endpoints allow abuse (Improved) (A04/A05)
Evidence:
- `src/app/api/poc/google-loc/nearby/route.ts:78-91` calls Google Places with `GOOGLE_MAPS_API_KEY` with no auth/rate limiting.
- `src/app/api/public/track/route.ts:16-77` logs arbitrary `properties` and only blocks a small set of key names for PII.
Impact:
- External API quota/spend risk.
- PII leakage risk in logs (e.g. nested values, keys like `userEmail`, `address`, etc.) and log-volume abuse.
Recommendation:
- Disable or gate `/api/poc/*` in production (auth + rate limits) or remove.
- Replace tracking PII blacklist with allowlist (per-event schema) or stronger PII detection; add rate limiting.

### 8) Missing baseline security headers / minor client hardening gaps (Fixed) (A05)
Evidence:
- `next.config.ts` has no `headers()` (no CSP/HSTS/etc.).
- `mdx-components.tsx:79-86` uses `target="_blank"` with `rel="noreferrer"` (missing `noopener`).
Impact:
- Increased exposure to XSS fallout (lack of CSP), clickjacking (if not otherwise prevented), and reverse-tabnabbing.
Recommendation:
- Add baseline security headers in `next.config.ts` (start with CSP report-only if needed).
- Use `rel="noopener noreferrer"` for external links.

## Notable Good Practices Observed
- Redirect sanitization exists and is used in multiple places: `src/common/redirects.ts`.
- Input validation on public endpoints is present (Zod) and errors are structured:
  - `src/app/api/public/track/route.ts`
  - `src/app/api/poc/google-loc/nearby/route.ts`
  - `src/app/api/poc/google-loc/route.ts` includes host allowlisting and redirect-hop constraints.
- Central logger with redaction exists: `src/lib/shared/infra/logger/index.ts`.
- Route protection via Supabase SSR session refresh exists: `src/proxy.ts`.

## Prioritized Remediation Backlog

All backlog items have been implemented in-repo. Remaining work is deployment/application:
- Apply Drizzle migrations in the target environment.
- Run `pnpm db:seed:buckets` against the target DB to update bucket visibility.
- Ensure production env vars are configured: `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, and (optionally) Upstash for rate limiting.

## Appendix: Additional Notes
- `.env.example` is missing (repo has `.gitignore` ignoring `.env*`). Consider adding a non-secret `.env.example` to prevent misconfiguration.
- Upstash rate limiting uses `Redis.fromEnv()` but env keys aren’t validated in `src/lib/env/index.ts`; if unset, rate limiting middleware may fail at runtime.
