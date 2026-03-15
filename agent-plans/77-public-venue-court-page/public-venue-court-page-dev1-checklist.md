# Developer Checklist (Dev1)

Focus Area: Public nested court page (detail + availability)

Modules: 1A, 2A, 3A

## Shared / Contract

- [ ] Add `appRoutes.places.courts.detail()` in `src/shared/lib/app-routes.ts`.
- [ ] Confirm query params: `view`, `month`, `date`, `duration`, `startTime`.

## Server / Backend

- [ ] N/A (reuse existing tRPC endpoints).

## Client / Frontend

### Module 1A: Route + metadata

- [ ] Add `src/app/(public)/venues/[venueSlug]/courts/[courtId]/page.tsx`.
- [ ] Implement server canonical redirect (UUID → slug) and preserve query params.
- [ ] Validate court belongs to venue (404 if not).
- [ ] Add `generateMetadata` with canonical `/venues/<slug>/courts/<courtId>`.

### Module 2A: UI + availability

- [ ] Add `src/app/(public)/venues/[venueSlug]/courts/[courtId]/court-detail-client.tsx`.
- [ ] Add `src/features/discovery/components/court/court-availability-panel.tsx`.
- [ ] Add `src/features/discovery/helpers/public-schedule.ts`.
- [ ] Implement nuqs state + defaults + clamping.
- [ ] Implement day + month availability queries (`availability.getForCourt`, `availability.getForCourtRange`).
- [ ] Implement selection + booking CTA to `/venues/[slug]/book?...`.
- [ ] Add Motion transitions (AnimatePresence + reduced motion).

### Module 3A: Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
- [ ] Manual smoke tests per `77-03-qa.md`.
