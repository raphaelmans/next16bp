# [00-88] Venues Copy And Routing

> Date: 2026-01-21
> Previous: 00-87-owner-partner-landing.md

## Summary

Migrated user-facing language from “Places” to “Venues” while keeping internal domain naming (`place`, `places`, `placeId`, DB tables, error codes) unchanged. Canonical URLs now use `/venues/*` (and `/owner/venues/*`) with permanent redirects from legacy `/places/*` (and `/owner/places/*`) and internal rewrites so no filesystem route renames were required.

## Changes Made

### Routing & Canonical URLs

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Updated `appRoutes.places.*` to generate `/venues/*` URLs and `appRoutes.owner.places.*` to generate `/owner/venues/*`; expanded booking route pattern to include `/venues/:id/book`. |
| `src/proxy.ts` | Added 308 redirects `/places/* -> /venues/*` and `/owner/places/* -> /owner/venues/*`; added internal rewrites `/venues/* -> /places/*` and `/owner/venues/* -> /owner/places/*`; ensured Supabase cookie refresh still works with rewrites. |

### UI Copywriting (Places -> Venues)

| File | Change |
|------|--------|
| `src/features/owner/components/owner-sidebar.tsx` | Owner nav + empty-state copy: “Venues”, “No venues yet”. |
| `src/app/(owner)/owner/places/page.tsx` | Owner hub: “My Venues”, “Add New Venue”, empty state, edit button copy. |
| `src/app/(owner)/owner/places/new/page.tsx` | Create flow: “Create New Venue” + toast + descriptions. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Edit flow: “Edit Venue”, “Venue verification”, delete copy/toasts. |
| `src/features/owner/components/place-form.tsx` | Form labels and submit CTA: “Venue Details”, “Venue Name”, “Create Venue”. |
| `src/features/owner/components/court-form.tsx` | Court form selects: “Venue” label + helper copy. |
| `src/features/owner/components/place-court-filter.tsx` | Filter placeholders: “All venues”. |
| `src/app/(owner)/owner/verify/page.tsx` | Owner verification landing: “Venue Verification” + empty-state copy. |
| `src/app/(owner)/owner/verify/[placeId]/page.tsx` | Breadcrumbs/actions updated to “My Venues” / “Edit venue”. |
| `src/features/owner/components/place-verification-panel.tsx` | Panel header/helper copy switched to “Venue”. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Booking page copy: “Back to venue”, “venue page”. |
| `src/app/(public)/list-your-venue/page.tsx` | Owner marketing page: “Venue → Court → Verification” and supporting copy updated. |

### Validation & Error Messages (User-Facing)

| File | Change |
|------|--------|
| `src/features/owner/schemas/place-form.schema.ts` | Validation: “Venue name is required”. |
| `src/features/owner/schemas/court-form.schema.ts` | Validation: “Venue is required”. |
| `src/modules/place/errors/place.errors.ts` | Error messages: “Venue not found”, “owner of this venue” (codes unchanged). |
| `src/modules/place-verification/errors/place-verification.errors.ts` | Error messages updated to “Venue …” variants (codes unchanged). |
| `src/modules/claim-request/errors/claim-request.errors.ts` | Claim-related messages updated to “venue”. |
| `src/modules/court/errors/court.errors.ts` | Duplicate label error message updated to “venue”. |
| `src/modules/place/services/place-management.service.ts` | Logger messages changed to “Venue …” while keeping event keys stable. |
| `src/modules/place-verification/services/place-verification*.ts` | Logger messages changed to “Venue …” while keeping event keys stable. |
| `src/modules/court/services/admin-court.service.ts` | Admin logger messages + batch messages updated to “venue” while keeping event keys stable. |

## Key Decisions

- Kept internal naming and filesystem routes as `places` to avoid risky renames across DB, schema, tRPC routers, and route params.
- Made `/venues` the canonical URL via proxy redirects + rewrites to preserve deep links and keep auth redirect behavior correct.
- Changed only user-facing strings (UI, validation messages, surfaced errors); kept error codes and event keys stable to avoid breaking clients/analytics.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
pnpm dev
```
