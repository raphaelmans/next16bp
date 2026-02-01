# [01-48] Security Hardening + Audit

> Date: 2026-02-01
> Previous: 01-47-email-verification-screen.md

## Summary

Implemented full repo-only security remediation based on OWASP Top 10 and Supabase/Postgres best practices, including cron auth hardening, signed URL access for sensitive storage, CSRF protections, and migration fixes. Updated audit documentation to reflect applied changes and added operational follow-ups.

## Changes Made

### Security / Auth / CSRF

| File | Change |
|------|--------|
| `src/lib/shared/infra/cron/cron-auth.ts` | Added fail-closed cron auth helper. |
| `src/app/api/cron/expire-reservations/route.ts` | Enforced cron auth + structured logging. |
| `src/app/api/cron/dispatch-notification-delivery/route.ts` | Enforced cron auth. |
| `src/app/api/trpc/[trpc]/route.ts` | Disabled GET and added same-origin CSRF checks. |
| `src/app/auth/callback/route.ts` | Removed forwarded-host redirects; use canonical origin. |
| `src/lib/shared/infra/trpc/context.ts` | Require `NEXT_PUBLIC_APP_URL` in production; stop trusting forwarded host. |
| `src/lib/shared/infra/trpc/server.ts` | Require `NEXT_PUBLIC_APP_URL` in production; remove forwarded host use. |
| `src/lib/shared/infra/auth/server-session.ts` | Use publishable key for cookie-bound sessions. |

### Storage Privacy + Signed URLs

| File | Change |
|------|--------|
| `src/lib/modules/storage/dtos/upload.dto.ts` | Added `BOOKINGS_IMPORTS` bucket and public bucket allowlist; `url` nullable. |
| `src/lib/modules/storage/services/object-storage.service.ts` | Only return public URL for public buckets. |
| `scripts/seed-storage-buckets.ts` | Set sensitive buckets private; added `bookings-imports`. |
| `src/lib/modules/payment-proof/services/payment-proof.service.ts` | Store file path; signed URL returned on read. |
| `src/lib/modules/place-verification/services/place-verification.service.ts` | Store file path for docs. |
| `src/lib/modules/place-verification/services/place-verification-admin.service.ts` | Signed URLs for admin document review. |
| `src/lib/modules/reservation/services/reservation-owner.service.ts` | Signed URLs for owner reservation list. |
| `src/lib/modules/bookings-import/services/bookings-import.service.ts` | Use private `bookings-imports` bucket. |
| `src/lib/modules/profile/services/profile.service.ts` | Assert public URL for avatar uploads. |
| `src/lib/modules/place/services/place-management.service.ts` | Assert public URL for place photo uploads. |
| `src/lib/modules/organization/services/organization.service.ts` | Assert public URL for org logo uploads. |
| `src/lib/modules/court/services/admin-court.service.ts` | Assert public URL for admin place photo uploads. |

### DB / Migrations / Integrity

| File | Change |
|------|--------|
| `drizzle/0000_jazzy_galactus.sql` | Removed `auth.users` creation (Supabase-managed). |
| `drizzle/0016_storage_file_paths.sql` | Added `file_path` columns + backfill from public URLs. |
| `drizzle/0017_enable_pg_trgm.sql` | Enabled `pg_trgm`. |
| `drizzle/0018_reservation_no_overlap.sql` | Added reservation overlap exclusion + sanity check. |
| `drizzle/0019_place_trgm_indexes.sql` | Created trigram indexes for place search. |
| `drizzle/meta/_journal.json` | Reconciled migration journal entries. |
| `src/lib/shared/infra/db/schema/reservation.ts` | Added `payment_proof.file_path`. |
| `src/lib/shared/infra/db/schema/place-verification.ts` | Added `file_path` and made `file_url` nullable. |

### Public Endpoint Hardening

| File | Change |
|------|--------|
| `src/lib/shared/infra/http/http-rate-limit.ts` | Added HTTP rate limit helper. |
| `src/app/api/public/track/route.ts` | Rate limiting + log only keys/count, not raw properties. |
| `src/app/api/poc/google-loc/route.ts` | Disabled in production + rate limiting. |
| `src/app/api/poc/google-loc/nearby/route.ts` | Disabled in production + rate limiting. |
| `src/app/(public)/poc/google-loc/page.tsx` | Disabled PoC page in production. |

### Frontend Hardening

| File | Change |
|------|--------|
| `next.config.ts` | Added baseline security headers + production CSP/HSTS. |
| `mdx-components.tsx` | Added `noopener` to external links. |
| `src/app/(admin)/admin/verification/[requestId]/page.tsx` | Handle null doc URLs; add `noopener`. |
| `src/app/(admin)/admin/courts/new/page.tsx` | Add `noopener`. |
| `src/app/(admin)/admin/courts/page.tsx` | Add `noopener`. |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Add `noopener`. |
| `src/features/reservation/components/terms-checkbox.tsx` | Add `noopener`. |
| `src/features/owner/components/place-form.tsx` | Add `noopener`. |
| `src/features/admin/components/admin-court-edit-form.tsx` | Add `noopener`. |
| `src/app/(public)/poc/google-loc/page-client.tsx` | Add `noopener`. |

### Pagination

| File | Change |
|------|--------|
| `src/lib/modules/bookings-import/dtos/list-rows.dto.ts` | Added `limit/offset`. |
| `src/lib/modules/bookings-import/repositories/bookings-import-row.repository.ts` | Added paginated query. |
| `src/lib/modules/bookings-import/services/bookings-import.service.ts` | List rows uses pagination. |
| `src/lib/modules/bookings-import/bookings-import.router.ts` | Pass pagination input. |
| `src/features/owner/components/owner-bookings-import-review-view.tsx` | Updated query/invalidation inputs. |
| `src/app/(owner)/owner/bookings/page.tsx` | Updated query/invalidation inputs. |

### Documentation / Env

| File | Change |
|------|--------|
| `SECURITY_AUDIT.md` | Updated report with implemented fixes and next steps. |
| `.env.example` | Added non-secret env template. |
| `.gitignore` | Allow committing `.env.example`. |

## Key Decisions

- Cron auth fails closed in production to prevent unauthenticated state changes if `CRON_SECRET` is missing.
- Sensitive storage objects moved to private buckets; store file paths and issue short-lived signed URLs after auth.
- Production now requires `NEXT_PUBLIC_APP_URL` to avoid host header trust for redirects and internal calls.
- tRPC GET disabled and POST enforces same-origin checks to reduce CSRF risk for cookie-auth flows.

## Next Steps

- [ ] Run DB migrations in the target environment (`pnpm db:migrate`).
- [ ] Re-seed storage buckets with new visibility (`pnpm db:seed:buckets`).
- [ ] Ensure production env vars are set (`CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, Upstash if desired).
- [ ] Review RLS policies in Supabase (out of scope for repo-only audit).

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
pnpm db:migrate
pnpm db:seed:buckets
```
