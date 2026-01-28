# [01-24] Owner Onboarding Decommission

> Date: 2026-01-28
> Previous: 01-23-import-court-scope.md

## Summary

Decommissioned the legacy `/owner/onboarding` page by turning it into a redirect to the owner setup hub (`/owner/get-started`). Updated owner gating and various CTAs to route users through the hub while preserving the original `?next=` destination.

## Changes Made

### Routing

| File | Change |
|------|--------|
| `src/app/(owner)/layout.tsx` | Redirect owners without an org to `appRoutes.owner.getStarted` instead of onboarding. |
| `src/app/(auth)/owner/onboarding/page.tsx` | Replaced onboarding UI with a redirect to `/owner/get-started` (keeps safe `next` param). |
| `src/app/(auth)/owner/get-started/page.tsx` | Added `next` query param handling; once org exists, auto-redirects to the safe owner `next` path. |

### CTA Updates

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/new/page.tsx` | Updated "Go to onboarding" link to "Get started" and routed to `/owner/get-started?next=...`. |
| `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx` | Same update to get-started hub. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Same update to get-started hub. |
| `src/features/discovery/components/navbar.tsx` | Updated authenticated non-owner path to go to `/owner/get-started?next=/owner/venues/new`. |
| `src/app/(auth)/home/page.tsx` | Updated owner intent fallback to go to `/owner/get-started?next=/owner/venues/new`. |

### Cleanup

| File | Change |
|------|--------|
| `src/app/(auth)/owner/onboarding/organization-form-client.tsx` | Deleted (no longer used after onboarding redirect). |

## Key Decisions

- Keep `/owner/onboarding` as a compatibility route (301/redirect behavior via Next.js redirect) rather than removing it outright, to avoid breaking historical links.
- Move all "create org" recovery flows through `/owner/get-started`, since it already contains the stepper and now supports safe `next` continuation.

## Next Steps (if applicable)

- [ ] Remove or mark `appRoutes.owner.onboarding` as deprecated (it is still referenced in routing config/docs).
- [ ] Update docs/plans referencing `/owner/onboarding` to point to `/owner/get-started`.

## Commands to Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
