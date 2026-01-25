# 1) Organization Creation

## What the owner experiences

```text
/list-your-venue
   |
   | CTA: “Start onboarding”
   | sets localStorage: kudos.owner_onboarding=true
   v
/login  ->  /home
   |
   | if user has no org && onboarding intent => /owner/onboarding
   v
/owner/onboarding
   |
   | owner submits organization form
   v
/owner/venues/new  (default next)
```

## Routes (UI)

- Public entry point: `src/app/(public)/list-your-venue/page.tsx`
- Home redirect logic: `src/app/(auth)/home/page.tsx`
- Onboarding page: `src/app/(auth)/owner/onboarding/page.tsx`
- Client form wrapper: `src/app/(auth)/owner/onboarding/organization-form-client.tsx`

## State / persistence

- Local onboarding intent flag (client-only):
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
