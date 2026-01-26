# [01-13] Owner Onboarding Revamp

> Date: 2026-01-26
> Previous: 01-12-bookings-import-mvp-complete.md

## Summary

Implemented the owner onboarding revamp funnel: a canonical public marketing page (`/owners/get-started`), owner-specific registration (`/register/owner`), a protected setup hub (`/owner/get-started`), and server-side post-login routing (`/post-login`) backed by a persisted `defaultPortal` preference.

## Changes Made

### UX / Routing

| File | Change |
|------|--------|
| `src/app/(public)/owners/get-started/page.tsx` | Added the new owner marketing landing page (3-step funnel + FAQ + CTAs). |
| `src/app/(public)/owners/get-started/layout.tsx` | Added canonical SEO metadata for `/owners/get-started`. |
| `src/app/(public)/list-your-venue/page.tsx` | Converted legacy page into a permanent redirect to `/owners/get-started`. |
| `src/app/(auth)/owner/get-started/page.tsx` | Added owner setup hub (create org, add venue, claim listing, import). |
| `src/app/(auth)/post-login/page.tsx` | Added server-side post-login router that chooses `/home` vs `/owner` vs `/owner/get-started`. |

### Auth Entry Points

| File | Change |
|------|--------|
| `src/app/(auth)/register/page.tsx` | Switched to a register page with role chooser when intent is unknown. |
| `src/app/(auth)/register/owner/page.tsx` | Added owner-specific register entry with default redirect to `/owner/get-started`. |
| `src/features/auth/components/register-form.tsx` | Added `title/description/defaultRedirect` props; default redirect now uses `/post-login`. |
| `src/features/auth/components/register-with-role-chooser.tsx` | Added Player vs Owner selection when no owner intent is present. |
| `src/features/auth/components/login-form.tsx` | Default redirect fallback now goes to `/post-login`. |
| `src/features/auth/components/magic-link-form.tsx` | Default redirect fallback now goes to `/post-login`. |
| `src/app/auth/callback/route.ts` | OAuth callback fallback now goes to `/post-login`. |
| `src/app/auth/confirm/route.ts` | Magic-link confirm fallback now goes to `/post-login`. |

### Default Portal Persistence

| File | Change |
|------|--------|
| `drizzle/0010_user_preferences_default_portal.sql` | Added `user_preferences` table and `default_portal` enum. |
| `src/shared/infra/db/schema/user-preferences.ts` | Added Drizzle schema for `user_preferences`. |
| `src/shared/infra/db/schema/enums.ts` | Added `defaultPortalEnum` (`player`/`owner`). |
| `src/modules/user-preference/*` | Added repository/service for reading/upserting default portal preference. |
| `src/modules/organization/services/organization.service.ts` | Sets `defaultPortal=owner` on successful organization creation. |

### SEO / Internal Links

| File | Change |
|------|--------|
| `src/app/sitemap.ts` | Replaced `/list-your-venue` with `/owners/get-started` in sitemap. |
| `src/features/discovery/components/footer.tsx` | Updated owner marketing link to `/owners/get-started`. |
| `src/features/discovery/components/navbar.tsx` | Updated owner CTA to route to `/owners/get-started` for unauthenticated users. |
| `src/features/home/components/organization-section.tsx` | Updated “Become a Partner” link to `/owners/get-started`. |
| `src/features/reservation/components/owner-cta-section.tsx` | Updated “Become a Partner” link to `/owners/get-started`. |
| `src/shared/components/kudos/ad-banner.tsx` | Updated owner CTA links to `/owners/get-started` (including anchors). |

### Setup Hub Add-Venue Redirect (Follow-up)

| File | Change |
|------|--------|
| `src/app/(auth)/owner/get-started/page.tsx` | Add-venue CTA now routes to `/owner/places/new?from=setup`. |
| `src/app/(owner)/owner/places/new/page.tsx` | Venue create success redirects to `/owner/verify/:placeId` when `from=setup`; otherwise keeps existing redirect to first-court creation. |

### Planning Artifacts

| File | Change |
|------|--------|
| `agent-plans/72-owner-onboarding-revamp/*` | Created the concrete implementation plan + checklists for delegation; updated as implementation progressed. |

## Key Decisions

- Canonical marketing entry is `/owners/get-started`; legacy `/list-your-venue` permanently redirects to it.
- Post-auth landing uses a server-side `/post-login` route so SSR can decide portal reliably (no localStorage).
- Default portal preference is persisted (`user_preferences.default_portal`) and set to `owner` when an organization is created.
- Setup hub uses a query param (`from=setup`) to preserve the legacy venue creation flow while allowing hub-specific redirect to verification.

## Validation

- `pnpm lint` passes.
- `pnpm build` passes.
- `TZ=UTC pnpm build` passes.

## Next Steps

- [ ] Manual smoke tests (QA):
  - `/owners/get-started` -> signup -> `/owner/get-started`.
  - `/list-your-venue` -> redirects to `/owners/get-started`.
  - `/owner/get-started` -> Add venue -> create venue -> lands on `/owner/verify/:placeId`.
  - Login without `redirect`:
    - player -> `/home`
    - owner with org -> `/owner`
    - owner without org but preference set -> `/owner/get-started`
- [ ] Ensure DB migration `0010_user_preferences_default_portal.sql` is applied in the target environment.

## Commands To Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
