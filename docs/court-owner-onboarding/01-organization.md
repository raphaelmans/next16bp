# 1) Organization Creation

## What the owner experiences

```text
/owners/get-started
   |
   | CTA -> /register/owner?redirect=/owner/get-started
   v
/owner/get-started (setup hub)
   |
   | “Create organization” (modal)
   | trpc.organization.create
   v
(Hub refreshes and unlocks next steps)

Fallback org creation path (still used as a gate):
  /owner/* (owner portal)
    -> if no org => /owner/onboarding
       -> creates org
       -> redirects to next (defaults to /owner/venues/new)
```

## Routes (UI)

- Public entry point (canonical): `src/app/(public)/owners/get-started/page.tsx`
- Legacy redirect: `src/app/(public)/list-your-venue/page.tsx` (permanent -> `/owners/get-started`)
- Post-auth routing: `src/app/(auth)/post-login/page.tsx`
- Setup hub (recommended): `src/app/(auth)/owner/get-started/page.tsx`
- Onboarding page: `src/app/(auth)/owner/onboarding/page.tsx`
- Client form wrapper: `src/app/(auth)/owner/onboarding/organization-form-client.tsx`

## State / persistence

- Local onboarding intent flag (client-only, still present):
  - `src/shared/lib/owner-onboarding-intent.ts` (localStorage key: `kudos.owner_onboarding`)
  - Cleared when entering owner route group via `src/features/owner/components/owner-onboarding-intent-clearer.tsx`.

## APIs (tRPC)

- `organization.my` (used to detect if org exists)
- `organization.create` (creates org)

Router/service:
- `src/modules/organization/organization.router.ts`
- `src/modules/organization/services/organization.service.ts`

## Data model (DB)

Core:
- `organization` (ownerUserId, name, slug, isActive, ...)
- `organization_profile` (logoUrl, contact details, ...)

Behavioral constraints:
- One organization per user is enforced in `OrganizationService.createOrganization` (rejects if user already owns an org).
- Slugs:
  - auto-generated from org name if not provided
  - cannot collide with existing org slugs
  - cannot use reserved route roots (derived from `appRoutes` + hardcoded: `api`, `_next`, `org`)
