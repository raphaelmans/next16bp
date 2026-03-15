# Owner Onboarding Revamp - Client Dev1 Checklist

## Shared / Contract

- [x] Add/confirm route constants in `src/shared/lib/app-routes.ts`.
- [x] Confirm analytics event names to implement.

## Server / Backend

- [x] N/A (coordinate with server dev on `/post-login` and preference)

## Client / Frontend

### Public marketing page + redirect

- [x] Implement `/owners/get-started` page + metadata layout.
- [x] Implement `/list-your-venue` permanent redirect.
- [x] Update internal links to new route.
- [x] Update sitemap entry.

### Auth entrypoints

- [x] Implement `/register/owner` (owner copy, default redirect).
- [x] Add role chooser to `/register` only when intent unknown.

### Owner setup hub

- [x] Implement `/owner/get-started` hub page (in `(auth)` group).
- [x] Card: Create org (wire to `trpc.organization.create`).
- [x] Card: Claim listing (wire to `trpc.place.list` + `trpc.claimRequest.submitClaim` + `trpc.claimRequest.getMy`).
- [x] Card: Import bookings (link to `/owner/import/bookings`; include copy about commit + screenshots).
- [x] Follow-up: hub Add venue should redirect to `/owner/verify/:placeId` after venue creation.
  - Checklist: `agent-plans/72-owner-onboarding-revamp/owner-onboarding-revamp-followup-add-venue-redirect-dev1-checklist.md`

### Final QA

- [x] Run `pnpm lint` and `pnpm build` locally.
