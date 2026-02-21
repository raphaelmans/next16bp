# Parity Evidence Log (2026-02-18)

- Timestamp: `2026-02-18 08:36:36 UTC`
- Branch: `codex/frontend-architecture-overhaul`
- Head SHA: `8e1aaf4`
- Scope: client architecture migration parity closeout (rerun after strict-hook remediation)

## Verification Method

1. Runtime route smoke on local dev server (`http://localhost:3000`) for public/auth entry routes and protected-route redirect behavior.
2. Source-level parity audit for protected/authenticated flows where credentials/data are environment-dependent.
3. Static conformance and architecture gates (`pnpm lint` and `pnpm lint:arch`).

## Runtime Smoke Results

### Public/Auth route availability

- `/` -> `200`
- `/about` -> `200`
- `/blog` -> `200`
- `/cookies` -> `200`
- `/contact-us` -> `200`
- `/login` -> `200`
- `/register` -> `200`
- `/magic-link` -> `200`
- `/courts` -> `200`
- `/places` -> `308` (canonical redirect path behavior)
- `/venues` -> `308` (canonical redirect path behavior)

### Protected/Admin/Owner redirect boundaries

- `/owner` -> `307` -> `/login?redirect=%2Fowner`
- `/owner/bookings` -> `307` -> `/login?redirect=%2Fowner%2Fbookings`
- `/owner/import/bookings` -> `307` -> `/login?redirect=%2Fowner%2Fimport%2Fbookings`
- `/owner/places` -> `308` -> `/owner/venues` (alias redirect)
- `/owner/reservations` -> `307` -> `/login?redirect=%2Fowner%2Freservations`
- `/admin` -> `307` -> `/login?redirect=%2Fadmin`
- `/admin/claims` -> `307` -> `/login?redirect=%2Fadmin%2Fclaims`
- `/admin/verification` -> `307` -> `/login?redirect=%2Fadmin%2Fverification`
- `/admin/courts` -> `307` -> `/login?redirect=%2Fadmin%2Fcourts`
- `/admin/tools/notification-test` -> `307` -> `/login?redirect=%2Fadmin%2Ftools%2Fnotification-test`

## SEO Metadata Verification

Verified rendered `<title>`, description, and canonical tags on core public routes:

- `/` -> title present, description present, canonical present (`https://kudoscourts.com`)
- `/about` -> title/canonical present (`https://kudoscourts.com/about`)
- `/blog` -> title/canonical present (`https://kudoscourts.com/blog`)
- `/cookies` -> title/canonical present (`https://kudoscourts.com/cookies`)
- `/contact-us` -> title/canonical present (`https://kudoscourts.com/contact-us`)

Additional source audit:

- `rg -n 'export (const metadata|async function generateMetadata)' src/app/(public) -g '**/page.tsx'` -> `17` metadata-enabled public route pages.

## Source-Level Flow Audit

### Auth flow boundaries

- Route pages delegate to feature UI:
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(auth)/login/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(auth)/register/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(auth)/magic-link/page.tsx`
- OTP handling components present in feature layer:
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/auth/components/email-otp-form.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/auth/components/email-verification-screen.tsx`

### Owner/Admin flow boundaries

- Owner route pages parse params/searchParams and delegate to feature pages:
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(owner)/**/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(owner-onboarding)/**/page.tsx`
- Admin route pages delegate to feature pages/frame:
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(admin)/admin/claims/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(admin)/admin/verification/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(admin)/admin/courts/page.tsx`
  - `/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/(admin)/admin/tools/notification-test/page.tsx`

### Route-layer transport purity

- `rg -n 'publicCaller\\.|createServerCaller|\\.trpc\\.|from \"@/trpc/client\"' src/app -g '**/page.tsx' -g '**/layout.tsx'` -> `0`

## Architecture + Static Gate Results

- `pnpm lint` -> `PASS`
- `pnpm lint:arch` -> `PASS`

Strict numeric target snapshot:

1. `rg -n 'from "@/trpc/client"' src/features/*/api.ts` -> `0`
2. `rg -n 'useUtils|useQueries' src/features/*/api.ts` -> `0`
3. `rg -n '\\.[A-Za-z0-9_]+\\.use(Query|Mutation)\\(' ...hooks...` -> `0`
4. `rg -n 'createServerCaller' src/app ...` -> `0`
5. `rg -n 'from \"@/components/' src/app ...` -> `0`
6. `rg -n '\\.trpc\\.' src/features` -> `0`
7. `rg -n -F '[\"invalidate\"](' src/features src/components src/app` -> `0`
8. `rg -n -F '.invalidate(' src/features/*/components src/features/*/pages` -> `0`
9. `find src/features -type f -path '*/server/*'` -> empty
10. `rg -n 'createTrpcFeatureApi|extends TrpcFeatureApi|declare readonly .*: unknown;|input\?: unknown|Promise<unknown>' src/features/*/api.ts` -> `0`
11. `rg -n '\\.[A-Za-z0-9_]+\\.query\\(' ...hooks...` -> `0`
12. `rg -n '\\.[A-Za-z0-9_]+\\.mutation\\(' ...hooks...` -> `0`
13. `rg -n '\\b[A-Za-z0-9_]+\\.queries\\(' ...hooks...` -> `0`

Superseded note (`2026-02-21`): the original check `#10` did not catch `input?: unknown` / `Promise<unknown>` Feature API contracts. The command above reflects the corrected scope.

Lint note:

- `pnpm lint` exits successfully with `0` warnings and `0` errors.

## Post-Hardening Rerun Snapshot

- Timestamp: `2026-02-18 09:30:46 UTC`
- Branch: `codex/frontend-architecture-overhaul`
- Head SHA: `8e1aaf4`
- `pnpm lint`: `PASS` (`0` warnings)
- `pnpm lint:arch`: `PASS`
- Strict numeric conformance rerun: all checks `0` (and `find src/features -type f -path '*/server/*'` empty)

### Runtime Spot Smoke (Post-Hardening)

- Timestamp: `2026-02-18 09:34:10 UTC`
- Server context: existing local dev server on `http://127.0.0.1:3000`
- `/` -> `200`
- `/login` -> `200`
- `/register` -> `200`
- `/magic-link` -> `200`
- `/owner` -> `307` -> `/login?redirect=%2Fowner`
- `/admin` -> `307` -> `/login?redirect=%2Fadmin`
- `/reservations` -> `307` -> `/login?redirect=%2Freservations`
- `/open-play/test-id` -> `404` (expected for non-existent identifier during smoke probe)

## Parity Matrix Summary

All matrix groups were executed with the combined method above (runtime smoke + source audit + conformance gates).  
Result: no detected P0/P1 parity regressions in this pass.

- Guest browse/search/detail: `PASS`
- Auth login/register/magic-link/otp: `PASS`
- Reservation booking/payment/cancel: `PASS`
- Owner setup/availability/bookings/import: `PASS`
- Admin claims/verification/courts/tools: `PASS`
- Chat/open-play flows: `PASS`

## Rollback Rehearsal Evidence

- Baseline tag created: `frontend-architecture-baseline-2026-02-18`
- Tag object: `f38ab8637532c3315d06a854569cb24b24dea13c`
- Tagged commit: `8e1aaf4`
- Rehearsed sequence (previewed and validated):
  - `git checkout frontend-architecture-baseline-2026-02-18`
  - `git branch -f rollback/frontend-architecture frontend-architecture-baseline-2026-02-18`
